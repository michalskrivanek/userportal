import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import './App.css'

import { VmsList, VmDetail, VmsPageHeader, Options } from 'ovirt-ui-components'

const App = ({ vms, visibility }) => {
  const selectedVmId = visibility.get('selectedVmDetail')
  const showOptions = visibility.get('showOptions')

  let detailToRender = ''
  if (showOptions) {
    detailToRender = (<Options />)
  } else if (selectedVmId) {
    const selectedVm = selectedVmId ? vms.getIn(['vms', selectedVmId]) : undefined
    detailToRender = (<VmDetail vm={selectedVm} />)
  }

  return (
    <div>
      <VmsPageHeader title='oVirt User Portal' />
      <div className='container-fluid navbar-top-offset'>
        <VmsList />
        {detailToRender}
      </div>
    </div>
  )
}
App.propTypes = {
  vms: PropTypes.object.isRequired,
  visibility: PropTypes.object.isRequired,
}

export default connect(
  (state) => ({
    vms: state.vms,
    visibility: state.visibility,
  })
)(App)
