package expo.modules.calmnarration

import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.Voice
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.Locale

class CalmNarrationModule : Module() {
  private var engine: TextToSpeech? = null
  private var ready = false
  private val waiting = mutableListOf<(TextToSpeech?) -> Unit>()

  override fun definition() = ModuleDefinition {
    Name("CalmNarration")

    AsyncFunction("hasVoice") { language: String, promise: Promise ->
      withEngine { tts -> promise.resolve(tts?.let { findVoice(it, language) } != null) }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("speak") { text: String, language: String, volume: Double, queue: Boolean ->
      val tts = engine
      val voice = if (ready && tts != null) findVoice(tts, language) else null
      if (tts != null && voice != null && tts.setVoice(voice) == TextToSpeech.SUCCESS) {
        val options = Bundle().apply {
          putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, volume.toFloat())
        }
        val mode = if (queue) TextToSpeech.QUEUE_ADD else TextToSpeech.QUEUE_FLUSH
        tts.speak(text, mode, options, "calm-" + java.util.UUID.randomUUID())
      }
      Unit
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("stop") {
      engine?.takeIf { ready }?.stop()
      Unit
    }.runOnQueue(Queues.MAIN)

    OnDestroy {
      engine?.shutdown()
      engine = null
      ready = false
      val requests = waiting.toList()
      waiting.clear()
      requests.forEach { it(null) }
    }
  }

  private fun withEngine(action: (TextToSpeech?) -> Unit) {
    if (ready) {
      action(engine)
      return
    }
    val context = appContext.reactContext?.applicationContext
    if (context == null) {
      action(null)
      return
    }
    waiting.add(action)
    if (engine != null) return
    val mainThread = android.os.Handler(android.os.Looper.getMainLooper())
    engine = TextToSpeech(context) { status ->
      mainThread.post {
        ready = status == TextToSpeech.SUCCESS && engine != null
        if (!ready) {
          engine?.shutdown()
          engine = null
        }
        val requests = waiting.toList()
        waiting.clear()
        requests.forEach { it(engine) }
      }
    }
  }

  private fun findVoice(tts: TextToSpeech, language: String): Voice? {
    val locale = Locale.forLanguageTag(language)
    return tts.voices.orEmpty().filter {
      !it.isNetworkConnectionRequired && it.locale.language == locale.language &&
        !it.features.orEmpty().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)
    }.sortedWith(compareByDescending<Voice> { it.locale == locale }
      .thenByDescending { it.quality }
      .thenBy { it.name }).firstOrNull()
  }
}
