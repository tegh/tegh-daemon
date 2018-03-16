// @flow
import uuid from 'uuid/v4'
import { Record, List } from 'immutable'

import type { RecordOf, List as ListType } from 'immutable'

export type JobT = RecordOf<{
  id: string,
  name: string,
  createdAt: ?number,
}>

const JobRecord = Record({
  id: null,
  name: null,
  createdAt: null,
})

const Job = attrs => JobRecord({
  ...attrs,
  id: uuid(),
  createdAt: new Date().toISOString(),
})

export default Job