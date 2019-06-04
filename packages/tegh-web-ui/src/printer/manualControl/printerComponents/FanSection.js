import React from 'react'
import {
  Typography,
  Switch,
  FormControlLabel,
} from '@material-ui/core'

import useExecGCodes from '../../_hooks/useExecGCodes'

const FanSection = ({
  printer,
  component: {
    id,
    address,
    fan: {
      enabled,
      speed,
    },
  },
  disabled,
}) => {
  const onChange = useExecGCodes((e, enable) => ({
    printerID: printer.id,
    gcodes: [
      { toggleFan: { fans: { [address]: { enable } } } },
    ],
  }), [id])

  return (
    <div>
      <Typography variant="h4" style={{ color: 'rgba(0, 0, 0, 0.54)' }}>
        {speed.toFixed(1)}
        %
      </Typography>
      <div style={{ marginTop: -3 }}>
        <FormControlLabel
          control={(
            <Switch
              checked={enabled}
              onChange={onChange}
              disabled={disabled}
              aria-label="enable-fan"
            />
            )}
          label="Enable Fan"
        />
      </div>
    </div>
  )
}

export default FanSection