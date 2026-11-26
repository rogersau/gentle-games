Pod::Spec.new do |s|
  s.name           = 'CalmNarration'
  s.version        = '1.0.0'
  s.summary        = 'On-device prompt narration for Gentle Games'
  s.license        = 'MIT'
  s.author         = 'Gentle Games'
  s.homepage       = 'https://gentlegames.org'
  s.source         = { :git => 'https://github.com/rogersau/gentle-games.git' }
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files   = '**/*.swift'
end
