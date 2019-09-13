import React, { Component } from 'react';
import { debounce } from 'lodash';
import { SCREENSHOT_INTERACTION_MODE, INTERACTION_MODE } from './shared';
import { Card, Icon, Button, Spin, Tooltip, Modal, Tabs, Select } from 'antd';
import Screenshot from './Screenshot';
import SelectedElement from './SelectedElement';
import Source from './Source';
import InspectorStyles from './Inspector.css';
import RecordedActions from './RecordedActions';
import Actions from './Actions';
import { clipboard, ipcRenderer } from 'electron';
import fs from 'fs';

const {SELECT, SWIPE, TAP} = SCREENSHOT_INTERACTION_MODE;

const { TabPane } = Tabs;

const ButtonGroup = Button.Group;

const MIN_WIDTH = 2000;
const MIN_HEIGHT = 1000;
const MAX_SCREENSHOT_WIDTH = 500;

const WORKSPACE = process.env.WORKSPACE || "";

export default class Inspector extends Component {

  constructor () {
    super();
    this.desiredCapabilities = [];

    var files = fs.readdirSync(WORKSPACE);
    for (var i=0; i<files.length; i++) {
        let file = files[i];
        if(file.endsWith(".json")) {
          let path = WORKSPACE + "/" + file;
          var data = fs.readFileSync(path);
          if( data.indexOf("desiredCapabilities") >= 0 ){
            this.desiredCapabilities.push(file);
          }
        }
    }

    this.didInitialResize = false;
    this.switchDesiredCapabilities = this.switchDesiredCapabilities.bind(this);
    this.handleChangeDesiredCapabilities = this.handleChangeDesiredCapabilities.bind(this);
    this.state = {
      selectedCaps: this.desiredCapabilities[0],
      modalTitle: 'Choose Desired Capabilities',
      modalOkCaption: 'Switch',
      confirmLoading: false,
      showSpinning: true,
      spinningTip: 'Choose session please ...',
    };
    this.screenAndSourceEl = null;
    this.lastScreenshot = null;
    this.updateSourceTreeWidth = debounce(this.updateSourceTreeWidth.bind(this), 50);
  }

  updateSourceTreeWidth () {
    // the idea here is to keep track of the screenshot image width. if it has
    // too much space to the right or bottom, adjust the max-width of the
    // screenshot container so the source tree flex adjusts to always fill the
    // remaining space. This keeps everything looking tight.
    if (!this.screenAndSourceEl) {
      return;
    }

    const screenshotBox = this.screenAndSourceEl.querySelector('#screenshotContainer');
    const img = this.screenAndSourceEl.querySelector('#screenshotContainer img#screenshot');

    if (!img) {
      return;
    }

    const imgRect = img.getBoundingClientRect();
    const screenshotRect = screenshotBox.getBoundingClientRect();
    screenshotBox.style.flexBasis = `${imgRect.width}px`;
    if (imgRect.width < screenshotRect.width) {
      screenshotBox.style.maxWidth = `${imgRect.width}px`;
    } else if (imgRect.height < screenshotRect.height) {
      // get what the img width would be if it fills screenshot box height
      const attemptedWidth = (screenshotRect.height / imgRect.height) * imgRect.width;
      screenshotBox.style.maxWidth = attemptedWidth > MAX_SCREENSHOT_WIDTH ?
        `${MAX_SCREENSHOT_WIDTH}px` :
        `${attemptedWidth}px`;
    }
  }

  componentWillMount () {

  }

  componentDidMount () {
    const curHeight = window.innerHeight;
    const curWidth = window.innerWidth;
    const needsResize = (curHeight < MIN_HEIGHT) || (curWidth < MIN_WIDTH);
    if (!this.didInitialResize && needsResize) {
      const newWidth = curWidth < MIN_WIDTH ? MIN_WIDTH : curWidth;
      const newHeight = curHeight < MIN_HEIGHT ? MIN_HEIGHT : curHeight;
      // resize width to something sensible for using the inspector on first run
      window.resizeTo(newWidth, newHeight);
    }
    this.didInitialResize = true;
    //this.props.bindAppium();
    //this.props.applyClientMethod({methodName: 'source'});
    //this.props.getSavedActionFramework();
    window.addEventListener('resize', this.updateSourceTreeWidth);
  }

  componentDidUpdate () {
    const {screenshot} = this.props;
    // only update when the screenshot changed, not for any other kind of
    // update
    if (screenshot !== this.lastScreenshot) {
      this.updateSourceTreeWidth();
      this.lastScreenshot = screenshot;
    }
  }

  screenshotInteractionChange (mode) {
    const {selectScreenshotInteractionMode, clearSwipeAction} = this.props;
    clearSwipeAction(); // When the action changes, reset the swipe action
    selectScreenshotInteractionMode(mode);
  }

  handleChangeDesiredCapabilities ( value ) {
    this.state.selectedCaps = value;
    
  }

  getCurrentCapabilities () {
    
    let path = WORKSPACE + "/" + this.state.selectedCaps;
    const jsonObj = require(path);

    let caps = jsonObj.helpers.Appium.desiredCapabilities;
    let keys = Object.keys(caps);
    let values = Object.values(caps);

    let desiredCaps = [];
    for (var i=0; i<keys.length; i++) {
      let item = {};
      let key = keys[i];
      let value = values[i];
      item.name = key;
      item.type = 'text';
      item.value = value;
      desiredCaps.push(item);
    }

    return desiredCaps;
  }

  switchDesiredCapabilities ()  {
    const {hideDesiredCapsModal} = this.props;
    hideDesiredCapsModal(); 
    this.setState({
      modalTitle: 'Switching Desired Capabilities',
      modalOkCaption: 'Switching',
      confirmLoading: true,
      showSpinning: true,
      spinningTip: 'Initializing session...',
    });

    let desiredCaps = this.getCurrentCapabilities ();
    this.props.initializeSession(desiredCaps);
    ipcRenderer.once('appium-new-session-ready', () => {
      this.setState({
        modalTitle: 'Choose Desired Capabilities',
        modalOkCaption: 'Switch',
        confirmLoading: false,
        showSpinning: true,
        spinningTip: 'Taking screenshot...',
      });
      this.props.bindAppium();
      this.props.applyClientMethod({methodName: 'source'});
      this.props.getSavedActionFramework();
    });
    ipcRenderer.once('appium-client-command-response-source-done', () => {
      this.setState({
        modalTitle: 'Choose Desired Capabilities',
        modalOkCaption: 'Switch',
        confirmLoading: false,
        showSpinning: false,
      });
    });
  }

  render () {
    const {screenshot, screenshotError, selectedElement = {},
           applyClientMethod, quitSession, isRecording, showRecord, startRecording,
           pauseRecording, showLocatorTestModal,
           desiredCapsModalVisible, showDesiredCapsModal, hideDesiredCapsModal,
           screenshotInteractionMode,
           selectedInteractionMode, selectInteractionMode,
           showKeepAlivePrompt, keepSessionAlive, sourceXML, t} = this.props;
    const {path} = selectedElement;

    let main = <div className={InspectorStyles['inspector-main']} ref={(el) => {this.screenAndSourceEl = el;}}>
      <div id='screenshotContainer' className={InspectorStyles['screenshot-container']}>
        {screenshot && <Screenshot {...this.props} />}
        {screenshotError && t('couldNotObtainScreenshot', {screenshotError})}
        {!screenshot && !screenshotError &&
          <Spin tip={this.state.spinningTip} size="large" spinning={this.state.showSpinning}>
            <div className={InspectorStyles.screenshotBox} />
          </Spin>
        }
      </div>
      <div id='sourceTreeContainer' className={InspectorStyles['interaction-tab-container']} >
        {showRecord &&
          <RecordedActions {...this.props} />
        }
        <Tabs activeKey={selectedInteractionMode}
          size="small"
          onChange={(tab) => selectInteractionMode(tab)}>
          <TabPane tab={t('Source')} key={INTERACTION_MODE.SOURCE}>
            <div className='action-row'>
              <div className='action-col'>
                <Card title={<span><Icon type="file-text" /> {t('App Source')}</span>}>
                  <Source {...this.props} />
                </Card>
              </div>
              <div id='selectedElementContainer'
                className={`${InspectorStyles['interaction-tab-container']} ${InspectorStyles['element-detail-container']} action-col`}>
                <Card title={<span><Icon type="tag-o" /> {t('selectedElement')}</span>}
                  className={InspectorStyles['selected-element-card']}>
                  {path && <SelectedElement {...this.props}/>}
                  {!path && <i>{t('selectElementInSource')}</i>}
                </Card>
              </div>
            </div>
          </TabPane>
          <TabPane tab={t('Actions')} key={INTERACTION_MODE.ACTIONS}>
            <Card
              title={<span><Icon type="thunderbolt" /> {t('Actions')}</span>}
              className={InspectorStyles['interaction-tab-card']}>
              <Actions {...this.props} />
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </div>;

    let actionControls = <div className={InspectorStyles['action-controls']}>
      <ButtonGroup size="large" value={screenshotInteractionMode}>
        <Tooltip title={t('Select Elements')}>
          <Button icon='select' onClick={() => {this.screenshotInteractionChange(SELECT);}}
            type={screenshotInteractionMode === SELECT ? 'primary' : 'default'}
          />
        </Tooltip>
        <Tooltip title={t('Swipe By Coordinates')}>
          <Button icon='swap-right' onClick={() => {this.screenshotInteractionChange(SWIPE);}}
            type={screenshotInteractionMode === SWIPE ? 'primary' : 'default'}
          />
        </Tooltip>
        <Tooltip title={t('Tap By Coordinates')}>
          <Button icon='scan' onClick={() => {this.screenshotInteractionChange(TAP);}}
            type={screenshotInteractionMode === TAP ? 'primary' : 'default'}
          />
        </Tooltip>
        <Tooltip title={t('Switch desiredCapabilities')}>
          <Button icon='switcher' onClick={() => showDesiredCapsModal()}
            type={screenshotInteractionMode === TAP ? 'primary' : 'default'}
          />
        </Tooltip>
      </ButtonGroup>
    </div>;

    let controls = <div className={InspectorStyles['inspector-toolbar']}>
      {actionControls}
      <ButtonGroup size="large">
        <Tooltip title={t('Back')}>
          <Button id='btnGoBack' icon='arrow-left' onClick={() => applyClientMethod({methodName: 'back'})}/>
        </Tooltip>
        <Tooltip title={t('refreshSource')}>
          <Button id='btnReload' icon='reload' onClick={() => applyClientMethod({methodName: 'source'})}/>
        </Tooltip>
        {!isRecording &&
          <Tooltip title={t('Start Recording')}>
            <Button id='btnStartRecording' icon="eye-o" onClick={startRecording}/>
          </Tooltip>
        }
        {isRecording &&
          <Tooltip title={t('Pause Recording')}>
            <Button id='btnPause' icon="pause" type="danger" onClick={pauseRecording}/>
          </Tooltip>
        }
        <Tooltip title={t('Search for element')}>
          <Button id='searchForElement' icon="search" onClick={showLocatorTestModal}/>
        </Tooltip>
        <Tooltip title={t('Copy XML Source to Clipboard')}>
          <Button id='btnSourceXML' icon="copy" onClick={() => clipboard.writeText(sourceXML)}/>
        </Tooltip>
        <Tooltip title={t('quitSessionAndClose')}>
          <Button id='btnClose' icon='close' onClick={() => quitSession()}/>
        </Tooltip>
      </ButtonGroup>
    </div>;

    return <div className={InspectorStyles['inspector-container']}>
      {controls}
      {main}
      <Modal
        title={t('Session Inactive')}
        visible={showKeepAlivePrompt}
        onOk={() => keepSessionAlive()}
        onCancel={() => quitSession()}
        okText={t('Keep Session Running')}
        cancelText={t('Quit Session')}
      >
        <p>{t('Your session is about to expire')}</p>
      </Modal>
      <Modal title={t(this.state.modalTitle)}
        visible={desiredCapsModalVisible}
        confirmLoading={this.state.confirmLoading}
        okText={t(this.state.modalOkCaption)}
        cancelText={t('Cancel')}
        onCancel={hideDesiredCapsModal}
        onOk={this.switchDesiredCapabilities}
      >
        <Select
          defaultValue={this.state.selectedCaps}
          onChange={this.handleChangeDesiredCapabilities}
        >
          {this.desiredCapabilities.map(option => (
            <Select.Option key={option}>{option}</Select.Option>
          ))}
        </Select>
      </Modal>
    </div>;
  }
}
