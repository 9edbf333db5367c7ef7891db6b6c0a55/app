rm -rf build
cordova create build --id "com.vitumob.shopping.app" --name "VituMob"
cd build
cordova platform add ios android
cordova plugin add cordova-plugin-console
cordova plugin add cordova-plugin-device
# cordova plugin remove cordova-plugin-inappbrowser
cordova plugin add cordova-plugin-themeablebrowser
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-splashscreen
cordova plugin add cordova-plugin-statusbar
cordova plugin add cordova-plugin-crosswalk-webview
cd ..
gulp clean
bower install
gulp build
gulp watch
