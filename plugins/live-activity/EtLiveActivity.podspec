Pod::Spec.new do |s|
  s.name = 'EtLiveActivity'
  s.version = '1.0.0'
  s.summary = 'EasyTraining Live Activities bridge'
  s.license = 'MIT'
  s.homepage = 'https://github.com/koxsulo1A/EasyTraining'
  s.author = 'EasyTraining'
  s.source = { :git => 'https://github.com/koxsulo1A/EasyTraining.git', :tag => s.version.to_s }
  s.source_files = 'ios/Plugin/**/*.{swift,h,m}'
  s.ios.deployment_target = '14.0'
  s.dependency 'Capacitor'
  s.swift_version = '5.7'
end
