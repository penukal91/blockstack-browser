import React, { Component, PropTypes } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import { Person } from 'blockstack-profiles'

import AddressBar from '../components/AddressBar'
import { IdentityItem } from '../components/index'
import { IdentityActions } from '../store/identities'
import { AccountActions } from '../store/account'

function mapStateToProps(state) {
  return {
    localIdentities: state.identities.localIdentities,
    lastNameLookup: state.identities.lastNameLookup,
    identityAddresses: state.account.identityAccount.addresses,
    addressLookupUrl: state.settings.api.addressLookupUrl || ''
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Object.assign({}, IdentityActions, AccountActions), dispatch)
}

class IdentityPage extends Component {
  static propTypes = {
    localIdentities: PropTypes.object.isRequired,
    createNewIdentity: PropTypes.func.isRequired,
    refreshIdentities: PropTypes.func.isRequired,
    addressLookupUrl: PropTypes.string.isRequired,
    lastNameLookup: PropTypes.array.isRequired
  }

  constructor(props) {
    super(props)

    this.state = {
      localIdentities: this.props.localIdentities
    }
  }

  componentWillMount() {
    this.props.refreshIdentities(
      this.props.identityAddresses,
      this.props.addressLookupUrl,
      this.props.localIdentities,
      this.props.lastNameLookup
    )
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      localIdentities: nextProps.localIdentities
    })
  }

  render() {
    return (
      <div className="app-wrap-profiles">
        <div className="container-fluid site-wrapper">
          <nav className="navbar navbar-toggleable-md navbar-light bg-faded">
            <a className="navbar-brand" href="#">
              <img src="/images/app-icon-profiles.png" />
            </a>
            <div className="navbar-collapse" id="navbarSupportedContent">
              <ul className="nav navbar-nav m-b-20">
                <li className="navbar-text">
                  Profiles
                </li>
                <li className="navbar-text navbar-text-secondary">
                  Utility
                </li>
              </ul>
              <AddressBar placeholder="Search for people" />
            </div>
          </nav>
          <div class="card w-50">
            <div class="card-block">
              <h3 class="card-title">Card title</h3>
              <p class="card-text">With supporting text below as a natural lead-in to additional content.</p>

            {Object.keys(this.state.localIdentities).map((domainName) => {
              const identity = this.state.localIdentities[domainName],
                    person = new Person(identity.profile)
              if (identity.domainName) {
                return (
                  <IdentityItem key={identity.domainName}
                    label={identity.domainName}
                    pending={!identity.registered}
                    avatarUrl={person.avatarUrl() || ''}
                    url={`/profile/local/${identity.domainName}`} />
                )
              }
            })}

            </div>
          </div>
          <div className="m-t-2">
            <Link to="/names/register" className="btn btn-blue btn-lg" role="button" >
              +
            </Link>
          </div>
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(IdentityPage)