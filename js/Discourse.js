/* @flow */
'use strict'

import React from 'react'

import {
  Alert,
  AppState,
  Linking,
  NativeModules,
  Navigator,
  Platform,
  PushNotificationIOS,
  StyleSheet
} from 'react-native'

import Screens from './screens'
import SiteManager from './site_manager'
import SafariView from 'react-native-safari-view'

const ChromeCustomTab = NativeModules.ChromeCustomTab

if (Platform.OS === 'ios') {
  PushNotificationIOS.requestPermissions({'alert': true, 'badge': true})
}

class Discourse extends React.Component {

  constructor(props) {
    super(props)
    this._siteManager = new SiteManager()

    if (this.props.url) {
      this.openUrl(this.props.url)
    }


    this._handleAppStateChange = () => {
      console.log('Detected appstate change ' + AppState.currentState)

      if (AppState.currentState === 'inactive') {
        this._siteManager.enterBackground()
        if (this._navigator) {
          this._navigator.popToTop()
        }
        this._seenNotificationMap = null
      }

      if (AppState.currentState === 'active') {
        this._siteManager.exitBackground()
        this._siteManager.refreshSites({ui: false, fast: true})
      }
    }
  }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange)
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange)
  }

  openUrl(url) {
    if (Platform.OS === 'ios') {
      SafariView.show({url})
    } else {
      if (this.props.simulator) {
        Linking.openURL(url)
      } else {
        ChromeCustomTab.show(url)
          .then(()=>{})
          .catch((e)=>{ Alert.alert(e) })
      }
    }
  }

  render() {
    return (
      <Navigator
        style={styles.app}
        initialRoute={{ identifier: 'HomeScreen', index: 0 }}
        configureScene={(route, routeStack) => {
          switch (route.identifier) {
            case 'NotificationsScreen':
              return Navigator.SceneConfigs.FloatFromBottom
            default:
              return Navigator.SceneConfigs.FloatFromLeft
          }
        }}
        renderScene={(route, navigator) => {
          this._navigator = navigator
          switch (route.identifier) {
            case 'NotificationsScreen':
              return (<Screens.Notifications
                        openUrl={this.openUrl.bind(this)}
                        navigator={navigator}
                        seenNotificationMap={this._seenNotificationMap}
                        setSeenNotificationMap={(map)=>{this._seenNotificationMap = map}}
                        siteManager={this._siteManager}/>)
            default:
              return (<Screens.Home
                        openUrl={this.openUrl.bind(this)}
                        navigator={navigator}
                        siteManager={this._siteManager}/>)
          }
        }}
      />
    )
  }
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: 'white'
  },
  screenContainer: {
    flex: 1
  }
})

export default Discourse
