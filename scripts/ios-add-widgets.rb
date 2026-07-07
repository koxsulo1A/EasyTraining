# Wstrzykuje widget extension (Live Activities) do wygenerowanego projektu
# Capacitor (ios/App/App.xcodeproj). Uruchamiane w CI po `npx cap add ios`.
#
#   gem install xcodeproj
#   ruby scripts/ios-add-widgets.rb
#
# Idempotentny: przy ponownym uruchomieniu nic nie duplikuje.

require 'xcodeproj'
require 'fileutils'

PROJ_PATH   = 'ios/App/App.xcodeproj'
APP_TARGET  = 'App'
EXT_NAME    = 'EasyTrainingWidgets'
EXT_BUNDLE  = 'com.easytraining.app.widgets'
SRC_DIR     = 'ios-extras/Widgets'
DST_DIR     = "ios/App/#{EXT_NAME}"
DEPLOY_IOS  = '17.0'

abort "Brak #{PROJ_PATH} — najpierw npx cap add ios" unless File.directory?(PROJ_PATH)

# 1. Skopiuj źródła do drzewa projektu
FileUtils.mkdir_p(DST_DIR)
Dir.glob("#{SRC_DIR}/*").each { |f| FileUtils.cp(f, DST_DIR) }
puts "Skopiowano źródła → #{DST_DIR}"

project = Xcodeproj::Project.open(PROJ_PATH)

if project.targets.any? { |t| t.name == EXT_NAME }
  puts "Target #{EXT_NAME} już istnieje — pomijam"
  exit 0
end

app_target = project.targets.find { |t| t.name == APP_TARGET }
abort "Nie znaleziono targetu #{APP_TARGET}" unless app_target

# 2. Nowy target rozszerzenia (widget = app extension)
ext_target = project.new_target(:app_extension, EXT_NAME, :ios, DEPLOY_IOS)

# 3. Pliki źródłowe
group = project.main_group.new_group(EXT_NAME, EXT_NAME)
Dir.glob("#{DST_DIR}/*.swift").sort.each do |f|
  ref = group.new_reference(File.basename(f))
  ext_target.add_file_references([ref])
end
group.new_reference('Info.plist')

# 4. Build settings
ext_target.build_configurations.each do |config|
  bs = config.build_settings
  bs['PRODUCT_NAME']                    = EXT_NAME
  bs['PRODUCT_BUNDLE_IDENTIFIER']       = EXT_BUNDLE
  bs['INFOPLIST_FILE']                  = "#{EXT_NAME}/Info.plist"
  bs['IPHONEOS_DEPLOYMENT_TARGET']      = DEPLOY_IOS
  bs['SWIFT_VERSION']                   = '5.0'
  bs['TARGETED_DEVICE_FAMILY']          = '1,2'
  bs['SKIP_INSTALL']                    = 'YES'
  bs['CODE_SIGN_IDENTITY']              = ''
  bs['CODE_SIGNING_REQUIRED']           = 'NO'
  bs['CODE_SIGNING_ALLOWED']            = 'NO'
  bs['CURRENT_PROJECT_VERSION']         = '1'
  bs['MARKETING_VERSION']               = '1.0'
  bs['GENERATE_INFOPLIST_FILE']         = 'NO'
end

# 5. Zależność + embed do aplikacji
app_target.add_dependency(ext_target)
embed = app_target.copy_files_build_phases.find { |p| p.name == 'Embed App Extensions' }
unless embed
  embed = app_target.new_copy_files_build_phase('Embed App Extensions')
  embed.symbol_dst_subfolder_spec = :plug_ins
end
appex_ref = ext_target.product_reference
bf = embed.add_file_reference(appex_ref)
bf.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }

project.save
puts "Dodano target #{EXT_NAME} + embed do #{APP_TARGET}"

# 6. NSSupportsLiveActivities w Info.plist aplikacji
app_plist = 'ios/App/App/Info.plist'
plist = Xcodeproj::Plist.read_from_path(app_plist)
unless plist['NSSupportsLiveActivities']
  plist['NSSupportsLiveActivities'] = true
  plist['NSSupportsLiveActivitiesFrequentUpdates'] = false
  Xcodeproj::Plist.write_to_path(plist, app_plist)
  puts 'Ustawiono NSSupportsLiveActivities=true'
end
