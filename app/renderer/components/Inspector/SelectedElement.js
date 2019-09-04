import React, { Component } from 'react';
import _ from 'lodash';
import { getLocators } from './shared';
import styles from './Inspector.css';
import { Button, Row, Col, Input, Modal, Table, Alert, Tooltip, Select } from 'antd';
import { withTranslation } from '../../util';
import { clipboard } from 'electron';

const ButtonGroup = Button.Group;
const checkActions = ['Check Control Exist', 'Check Control Property'];
const propertyName = 'Property Name';
const propertyValue = 'Property Value';
/**
 * Shows details of the currently selected element and shows methods that can
 * be called on the elements (tap, sendKeys)
 */
class SelectedElement extends Component {

  constructor (props) {
    super(props);
    this.handleSendKeys = this.handleSendKeys.bind(this);
    this.handleCheck = this.handleCheck.bind(this);
    this.handleCheckActionChange = this.handleCheckActionChange.bind(this);
    this.state = {
      checkAction: checkActions[0],
      propertyInput: [],
    };
  }

  handleSendKeys () {
    const {sendKeys, applyClientMethod, hideSendKeysModal, selectedElementId: elementId} = this.props;
    applyClientMethod({methodName: 'sendKeys', elementId, args: [sendKeys]});
    hideSendKeysModal();
  }

  handleCheck () {
    const {check, applyClientMethod, hideCheckModal, selectedElementId: elementId} = this.props;
    applyClientMethod({methodName: 'check', elementId, args: [check]});
    hideCheckModal();
  }

  handleCheckActionChange (value) {
    this.setState({
      checkAction: value
    });

    if (this.state.checkAction === checkActions[0]) {
      this.setState({
        propertyInput: [propertyName, propertyValue],
      });
    } else {
      this.setState({
        propertyInput: [],
      });
    }
  }

  render () {
    const {
      applyClientMethod,
      setFieldValue,
      sendKeys,
      selectedElement,
      sendKeysModalVisible,
      showSendKeysModal,
      hideSendKeysModal,
      checkModalVisible,
      showCheckModal,
      hideCheckModal,
      selectedElementId: elementId,
      sourceXML,
      elementInteractionsNotAvailable,
      t,
    } = this.props;
    const {attributes, xpath} = selectedElement;

    // Get the columns for the attributes table
    let attributeColumns = [{
      title: t('Attribute'),
      dataIndex: 'name',
      key: 'name',
      width: 100
    }, {
      title: t('Value'),
      dataIndex: 'value',
      key: 'value'
    }];

    // Get the data for the attributes table
    let attrArray = _.toPairs(attributes).filter(([key]) => key !== 'path');
    let dataSource = attrArray.map(([key, value]) => ({
      key,
      value,
      name: key,
    }));
    dataSource.unshift({key: 'elementId', value: elementId, name: 'elementId'});

    // Get the columns for the strategies table
    let findColumns = [{
      title: t('Find By'),
      dataIndex: 'find',
      key: 'find',
      width: 100
    }, {
      title: t('Selector'),
      dataIndex: 'selector',
      key: 'selector'
    }];

    // Get the data for the strategies table
    let findDataSource = _.toPairs(getLocators(attributes, sourceXML)).map(([key, selector]) => ({
      key,
      selector,
      find: key,
    }));

    // If XPath is the only provided data source, warn the user about it's brittleness
    let showXpathWarning = false;
    if (findDataSource.length === 0) {
      showXpathWarning = true;
    }

    // Add XPath to the data source as well
    if (xpath) {
      findDataSource.push({
        key: 'xpath',
        find: 'xpath',
        selector: xpath,
      });
    }

    return <div>
      {elementInteractionsNotAvailable && <Row type="flex" gutter={10}>
        <Col>
          <Alert type="info" message={t('Interactions are not available for this element')} showIcon />
        </Col>
      </Row>}
      <Row justify="center" type="flex" align="middle" gutter={10} className={styles.elementActions}>
        <Col>
          <ButtonGroup size="small">
            <Button
              disabled={!elementId}
              icon={!elementInteractionsNotAvailable && !elementId && 'loading'}
              id='btnTapElement'
              onClick={() => applyClientMethod({methodName: 'click', elementId})}
            >
              {t('Tap')}
            </Button>
            <Button
              disabled={!elementId}
              id='btnSendKeysToElement'
              onClick={() => showSendKeysModal()}
            >
              {t('Send Keys')}
            </Button>
            <Button
              disabled={!elementId}
              id='btnCheckElement'
              onClick={() => showCheckModal()}
            >
              {t('Check')}
            </Button>
            <Button
              disabled={!elementId}
              id='btnClearElement'
              onClick={() => applyClientMethod({methodName: 'clear', elementId})}
            >
              {t('Clear')}
            </Button>
            <Tooltip title={t('Copy Attributes to Clipboard')}>
              <Button
                disabled={!elementId}
                id='btnCopyAttributes' icon="copy"
                onClick={() => clipboard.writeText(JSON.stringify(dataSource))}/>
            </Tooltip>
          </ButtonGroup>
        </Col>
      </Row>
      {findDataSource.length > 0 &&
        <Table
          columns={findColumns}
          dataSource={findDataSource}
          size="small"
          pagination={false}
        />}
      <br />
      {showXpathWarning &&
        <div>
          <Alert
            message={t('usingXPathNotRecommended')}
            type="warning"
            showIcon
          />
          <br />
        </div>
      }
      {dataSource.length > 0 &&
      <Row>
        <Table columns={attributeColumns} dataSource={dataSource} size="small" pagination={false} />
      </Row>
      }
      <Modal title={t('Send Keys')}
        visible={sendKeysModalVisible}
        okText={t('Send Keys')}
        cancelText={t('Cancel')}
        onCancel={hideSendKeysModal}
        onOk={this.handleSendKeys}
      >
        <Input
          placeholder={t('Enter keys')}
          value={sendKeys}
          onChange={(e) => setFieldValue('sendKeys', e.target.value)}
        />
      </Modal>
      <Modal title={t('Check')}
        visible={checkModalVisible}
        okText={t('Check')}
        cancelText={t('Cancel')}
        onCancel={hideCheckModal}
        onOk={() => applyClientMethod({methodName: 'check', elementId})}
      >
        <Select
          defaultValue={this.state.checkAction}
          className={styles.inputElements}
          onChange={this.handleCheckActionChange} value={this.state.checkAction}
        >
          {checkActions.map(option => (
            <Option key={option}>{option}</Option>
          ))}
        </Select>

        <div>
          {this.state.propertyInput.map(inputPlaceHolder => (
            <Input className={styles.inputElements} placeholder={inputPlaceHolder}/>
          ))}
        </div>
      </Modal>
    </div>;
  }
}

export default withTranslation(SelectedElement);
