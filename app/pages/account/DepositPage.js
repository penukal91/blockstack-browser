import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import { PublicKeychain } from 'keychain-manager'

import { AccountSidebar } from '../../components/index'
import { KeychainActions } from '../../store/keychain'

function mapStateToProps(state) {
  return {
    accountKeychain: state.keychain.bitcoinAccounts[0].accountKeychain,
    addressIndex: state.keychain.bitcoinAccounts[0].addressIndex
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(KeychainActions, dispatch)
}

class DepositPage extends Component {
  static propTypes = {
    accountKeychain: PropTypes.string.isRequired,
    addressIndex: PropTypes.number.isRequired,
    newBitcoinAddress: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)
    this.refreshAddress = this.refreshAddress.bind(this)
  }

  refreshAddress(event) {
    this.props.newBitcoinAddress()
  }

  render() {
    const accountKeychain = new PublicKeychain(this.props.accountKeychain),
          addressIndex = this.props.addressIndex,
          currentAddress = accountKeychain.child(addressIndex).address().toString()

    return (
      <div className="body-inner body-inner-white">
        <div className="page-header-wrap">
          <div className="container-fluid page-header p-r-5">
            <div className="pull-left m-t-1">
              <span className="m-l-2">
                <img src="images/ch-bw-rgb-rev.svg" alt="Chord logo" width="60px" />
              </span>
            </div>
            <h1 className="type-inverse text-lowercase m-t-11">Deposit</h1>
          </div>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-md-3">
              <AccountSidebar />
            </div>
            <div className="col-md-9">
              <p><i>
                Note: All identity registrations require funds from your account.
                To fund your account, send bitcoins to the address below.
              </i></p>

              <h5>Send Bitcoins to this address</h5>
              <div className="highlight">
                <pre>
                  <code>{currentAddress}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(DepositPage)

/*
  <div>
    <button className="btn btn-secondary" onClick={this.refreshAddress}>
      New Address
    </button>
  </div>
*/