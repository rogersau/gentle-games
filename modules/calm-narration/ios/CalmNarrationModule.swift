import AVFoundation
import ExpoModulesCore

public final class CalmNarrationModule: Module {
  private let synthesizer = AVSpeechSynthesizer()

  public func definition() -> ModuleDefinition {
    Name("CalmNarration")

    AsyncFunction("hasVoice") { (language: String) -> Bool in
      self.findVoice(language) != nil
    }.runOnQueue(.main)

    AsyncFunction("speak") { (text: String, language: String, volume: Double, queue: Bool) in
      guard let voice = self.findVoice(language) else { return }
      if !queue { self.synthesizer.stopSpeaking(at: .immediate) }
      let utterance = AVSpeechUtterance(string: text)
      utterance.voice = voice
      utterance.volume = Float(volume)
      self.synthesizer.speak(utterance)
    }.runOnQueue(.main)

    AsyncFunction("stop") {
      self.synthesizer.stopSpeaking(at: .immediate)
    }.runOnQueue(.main)
  }

  private func findVoice(_ language: String) -> AVSpeechSynthesisVoice? {
    let voices = AVSpeechSynthesisVoice.speechVoices().filter { voice in
      // Use only Apple's on-device system voices, not third-party speech providers.
      guard voice.identifier.hasPrefix("com.apple.") else { return false }
      if #available(iOS 17.0, *) {
        return !voice.voiceTraits.contains(.isNoveltyVoice) && !voice.voiceTraits.contains(.isPersonalVoice)
      }
      return true
    }
    let tag = language.lowercased()
    let family = tag.split(separator: "-").first
    return voices.first { $0.language.lowercased() == tag }
      ?? voices.first { $0.language.lowercased().split(separator: "-").first == family }
  }
}
