import React from 'react'
import { _RainContainer, getApp } from '@tmp/rain'

export function rootContainer(container) {
  return React.createElement(_RainContainer, null, container)
}

export function initialProps(props) {
  if (props) return props
  const state = getApp()._store.getState()
  return Object.keys(state).reduce((memo, key) => {
    if (!['@@dva', 'loading', 'routing'].includes(key)) {
      memo[key] = state[key]
    }
    return memo
  }, {})
}

export function modifyInitialProps(value) {
  if (value) {
    return {
      store: getApp()._store
    }
  }
  return {}
}
