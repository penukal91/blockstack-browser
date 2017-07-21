import React, { Component, PropTypes } from 'react'
import Modal from 'react-modal'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Alert from '../components/Alert'

import { AccountActions } from '../account/store/account'
import { SettingsActions } from '../account/store/settings'

import { PairBrowserView, LandingView,
  NewInternetView, RestoreView, DataControlView, EnterPasswordView,
  CreateIdentityView, WriteDownKeyView, ConfirmIdentityKeyView,
  EnterEmailView } from './components'


import { decrypt, isBackupPhraseValid } from '../utils'


import log4js from 'log4js'

const logger = log4js.getLogger('welcome/WelcomeModal.js')

const START_PAGE_VIEW = 0
const CREATE_IDENTITY_PAGE_VIEW = 4

function mapStateToProps(state) {
  return {
    api: state.settings.api,
    promptedForEmail: state.account.promptedForEmail,
    encryptedBackupPhrase: state.account.encryptedBackupPhrase
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Object.assign({}, AccountActions, SettingsActions), dispatch)
}

class WelcomeModal extends Component {
  static propTypes = {
    accountCreated: PropTypes.bool.isRequired,
    storageConnected: PropTypes.bool.isRequired,
    coreConnected: PropTypes.bool.isRequired,
    closeModal: PropTypes.func.isRequired,
    updateApi: PropTypes.func.isRequired,
    api: PropTypes.object.isRequired,
    emailKeychainBackup: PropTypes.func.isRequired,
    promptedForEmail: PropTypes.bool.isRequired,
    encryptedBackupPhrase: PropTypes.string,
    initializeWallet: PropTypes.func.isRequired,
    skipEmailBackup: PropTypes.func.isRequired
  }

  constructor(props) {
    super(props)

    if (this.props.accountCreated) {
      logger.error('User has refreshed browser mid onboarding.')
    }

    this.state = {
      accountCreated: this.props.accountCreated,
      storageConnected: this.props.storageConnected,
      coreConnected: this.props.coreConnected,
      pageOneView: 'create',
      email: '',
      page: START_PAGE_VIEW,
      password: null,
      identityKeyPhrase: null,
      alert: null
    }

    this.showLandingView = this.showLandingView.bind(this)
    this.showNewInternetView = this.showNewInternetView.bind(this)
    this.showRestoreView = this.showRestoreView.bind(this)
    this.showNextView = this.showNextView.bind(this)
    this.verifyPasswordAndCreateAccount = this.verifyPasswordAndCreateAccount.bind(this)
    this.restoreAccount = this.restoreAccount.bind(this)
    this.updateAlert = this.updateAlert.bind(this)
    this.setPage = this.setPage.bind(this)
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      accountCreated: nextProps.accountCreated,
      storageConnected: nextProps.storageConnected,
      coreConnected: nextProps.coreConnected
    })

    if (nextProps.accountCreated && !this.props.accountCreated) {
      logger.debug('account already created - checking for valid password in component state')
      decrypt(new Buffer(this.props.encryptedBackupPhrase, 'hex'), this.state.password)
      .then((identityKeyPhraseBuffer) => {
        logger.debug('Backup phrase successfully decrypted. Storing identity key.')
        this.setState({ identityKeyPhrase: identityKeyPhraseBuffer.toString() })
        this.setPage(CREATE_IDENTITY_PAGE_VIEW)
      }, () => {
        logger.debug('User has refreshed browser mid onboarding.')

        this.setPage(START_PAGE_VIEW)
      })
    }
  }

  onValueChange(event) {
    this.setState({
      [event.target.name]: event.target.value
    })
  }

  setPage(page) {
    this.setState({
      page,
      alert: null
    })
  }

  verifyPasswordAndCreateAccount(password, passwordConfirmation) {
    logger.trace('createAccount')
    return new Promise((resolve, reject) => {
      if (password !== passwordConfirmation) {
        logger.error('createAccount: password and confirmation do not match')
        this.updateAlert('danger',
        'The password confirmation does not match the password you entered.')
        reject()
      } else {
        this.setState({ password })

        logger.debug('Initializing account...')
        this.props.initializeWallet(password, null)
        resolve()
      }
    })
  }

  restoreAccount(identityKeyPhrase, password, passwordConfirmation) {
    logger.trace('restoreAccount')
    const { isValid } = isBackupPhraseValid(identityKeyPhrase)

    if (!isValid) {
      logger.error('restoreAccount: invalid backup phrase entered')
      this.updateAlert('danger', 'The identity key you entered is not valid.')
      return
    }

    if (password !== passwordConfirmation) {
      logger.error('restoreAccount: password and confirmation do not match')
      this.updateAlert('danger',
      'The password confirmation does not match the password you entered.')
      return
    }

    this.setState({
      identityKeyPhrase,
      password
    })
    this.props.initializeWallet(password, this.state.identityKeyPhrase)
  }

  showLandingView(event) {
    event.preventDefault()
    this.setState({
      pageOneView: 'newInternet'
    })
    this.setPage(0)
  }

  showNewInternetView(event)  {
    event.preventDefault()
    this.setState({
      pageOneView: 'newInternet',
      page: 1
    })
  }

  showRestoreView(event)  {
    event.preventDefault()
    this.setState({
      pageOneView: 'restore',
      page: 1
    })
  }

  showNextView(event)  {
    if (event) {
      event.preventDefault()
    }

    this.setPage(this.state.page + 1)
  }

  emailKeychainBackup(event) {
    event.preventDefault()
    this.props.emailKeychainBackup(this.state.email, this.props.encryptedBackupPhrase)
    return false
  }

  skipEmailBackup(event) {
    event.preventDefault()
    this.props.skipEmailBackup()
  }

  updateAlert(alertStatus, alertMessage) {
    this.setState({
      alert: { status: alertStatus, message: alertMessage }
    })
  }

  render() {
    const isOpen = !this.state.accountCreated ||
      !this.state.coreConnected || !this.props.promptedForEmail

    const needToPair = !this.state.coreConnected

    const page =  this.state.page
    const pageOneView = this.state.pageOneView
    const alert = this.state.alert

    return (
      <div className="">
        <Modal
          isOpen={isOpen}
          onRequestClose={this.props.closeModal}
          contentLabel="Welcome Modal"
          shouldCloseOnOverlayClick={false}
          style={{ overlay: { zIndex: 10 } }}
          className="container-fluid"
        >
          {needToPair ?
            <PairBrowserView />
          :
            <div>
              <div>
                {alert ?
                  <Alert key="1" message={alert.message} status={alert.status} />
                  :
                  null
                }
              </div>
              <div>
              {page === 0 ?
                <LandingView
                  showNewInternetView={this.showNewInternetView}
                  showRestoreView={this.showRestoreView}
                />
              : null}
              </div>
              <div>
                {
                  page === 1 ?
                    <div>
                    {
                        pageOneView === 'newInternet' ?
                          <NewInternetView
                            showNextView={this.showNextView}
                          />
                        :
                          <RestoreView
                            showLandingView={this.showLandingView}
                            restoreAccount={this.restoreAccount}
                          />
                    }
                    </div>
                  :
                  null
                }
              </div>
              <div>
              {
                page === 2 ?
                  <DataControlView
                    showNextView={this.showNextView}
                  />
                :
                null
              }
              </div>
              <div>
              {
                page === 3 ?
                  <EnterPasswordView
                    verifyPasswordAndCreateAccount={this.verifyPasswordAndCreateAccount}
                  />
                :
                null
              }
              </div>
              <div>
              {
                page === 4 ?
                  <CreateIdentityView
                    showNextView={this.showNextView}
                  />
                :
                null
              }
              </div>
              <div>
              {
                page === 5 ?
                  <WriteDownKeyView
                    identityKeyPhrase={this.state.identityKeyPhrase}
                    showNextView={this.showNextView}
                  />
                :
                null
              }
              </div>
              <div>
              {
                page === 6 ?
                  <ConfirmIdentityKeyView
                    identityKeyPhrase={this.state.identityKeyPhrase}
                    showNextView={this.showNextView}
                  />
                :
                null
              }
              </div>
              <div>
              {
                page === 7 ?
                  <EnterEmailView
                    skipEmailBackup={this.props.skipEmailBackup}
                  />
                :
                null
              }
              </div>
            </div>
          }
        </Modal>
      </div>
    )
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(WelcomeModal)
