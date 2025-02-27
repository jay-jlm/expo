package abi43_0_0.expo.modules.adapters.react.apploader

import android.content.Context
import abi43_0_0.com.facebook.react.ReactApplication
import abi43_0_0.com.facebook.react.ReactInstanceManager
import expo.modules.apploader.HeadlessAppLoader
import expo.modules.core.interfaces.Consumer
import abi43_0_0.expo.modules.core.interfaces.DoNotStrip

private val appRecords: MutableMap<String, ReactInstanceManager> = mutableMapOf()

class RNHeadlessAppLoader @DoNotStrip constructor(private val context: Context) : HeadlessAppLoader {

  //region HeadlessAppLoader

  override fun loadApp(context: Context, params: HeadlessAppLoader.Params?, alreadyRunning: Runnable?, callback: Consumer<Boolean>?) {
    if (params == null || params.appScopeKey == null) {
      throw IllegalArgumentException("Params must be set with appScopeKey!")
    }

    if (context.applicationContext is ReactApplication) {
      val reactInstanceManager = (context.applicationContext as ReactApplication).reactNativeHost.reactInstanceManager
      if (!appRecords.containsKey(params.appScopeKey)) {
        reactInstanceManager.addReactInstanceEventListener {
          HeadlessAppLoaderNotifier.notifyAppLoaded(params.appScopeKey)
          callback?.apply(true)
        }
        appRecords[params.appScopeKey] = reactInstanceManager
        if (reactInstanceManager.hasStartedCreatingInitialContext()) {
          reactInstanceManager.recreateReactContextInBackground()
        } else {
          reactInstanceManager.createReactContextInBackground()
        }
      } else {
        alreadyRunning?.run()
      }
    } else {
      throw IllegalStateException("Your application must implement ReactApplication")
    }
  }

  override fun invalidateApp(appScopeKey: String?): Boolean {
    return if (appRecords.containsKey(appScopeKey) && appRecords[appScopeKey] != null) {
      val appRecord: ReactInstanceManager = appRecords[appScopeKey]!!
      android.os.Handler(context.mainLooper).post {
        appRecord.destroy()
        HeadlessAppLoaderNotifier.notifyAppDestroyed(appScopeKey)
        appRecords.remove(appScopeKey)
      }
      true
    } else {
      false
    }
  }

  override fun isRunning(appScopeKey: String?): Boolean =
    appRecords.contains(appScopeKey) && appRecords[appScopeKey]!!.hasStartedCreatingInitialContext()

  //endregion HeadlessAppLoader
}
