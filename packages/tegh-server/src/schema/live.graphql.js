import _ from 'lodash'
import tql from 'typiql'

import {
  GraphQLLiveData,
  subscribeToLiveData,
} from 'graphql-live-subscriptions'

import QueryRootGraphQL from './QueryRoot.graphql.js'

const RESPONSE_THROTTLE_MS = 500

const type = () => QueryRootGraphQL

const liveGraphQL = () => ({
  type: GraphQLLiveData({
    name: 'LiveSubscriptionRoot',
    type,
  }),

  subscribe: subscribeToLiveData({
    type,
    getSubscriptionProvider: async (source, args, context, resolveInfo) => {
      return {
        subscribe: cb => {
          return context.store.subscribe(_.throttle(cb, RESPONSE_THROTTLE_MS))
        }
      }
    },

    /* getSource must not return null */
    getSource: async () => 'rootValue',
  }),

  resolve: source => source,
})

export default liveGraphQL