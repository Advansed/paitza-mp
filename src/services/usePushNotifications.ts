import { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { useLoginStore } from '../Store/loginStore'
import { preparePush, pushLogout, subscribePushNav, syncPushUser } from './pushNotifications'

export function usePushNotifications() {
  const auth = useLoginStore((state) => state.auth)
  const userId = useLoginStore((state) => state.id)
  const userType = useLoginStore((state) => state.user_type)

  useEffect(() => {
    void preparePush()
  }, [])

  useEffect(() => {
    if (!auth || !userId) {
      void pushLogout()
      return
    }
    void syncPushUser(userId, userType)
  }, [auth, userId, userType])
}

export function PushNavigator() {
  const history = useHistory()

  useEffect(() => subscribePushNav((path) => history.push(path)), [history])

  return null
}
