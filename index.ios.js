/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ListView,
  TouchableOpacity,
  Dimensions,
  Image,
  TouchableWithoutFeedback,
  ScrollView,
  AlertIOS
} from 'react-native';

// import MJStartCityListView from './MJStartCityListView';
// import { localListViewName, foreignListViewName, containerTop, locationViewHeight, getListViewData } from './MJStartCityListModel';
import { localSectionArr, localData, foreignSectionArr, foreignData, locationCity } from './mock';

const WINDOW_WIDTH = Dimensions.get('window').width;
const WINDOW_HEIGHT = Dimensions.get('window').height;
const rowHeight = 50;
const sectionHeight = 20;
const containerTop = 20;
const locationViewHeight = 40;
const localListViewName = 'listView_local';
const foreignListViewName = 'listView_foreign';

class MJCity {

  /// 构造
  constructor({ cityId, cityName, cityAleph, selected }) {
    this.cityId = cityId;
    this.cityName = cityName;
    this.cityAleph = cityAleph;
    this.selected = selected;
  }
}

class HelloWorldApp extends Component {

  constructor(props) {
    super(props);

    // 初始状态
    let lRes = this._getListViewData(true, locationCity.cityId);
    let fRes = this._getListViewData(false, locationCity.cityId);

    let s = Symbol();

    this.state = {
      s: 'Hello s!',
      [s]: 'Hello [s]!',

      locationState: true, // 定位状态
      isSupport: true, // 定位城市是否支持

      localDataSource: this._createDataSource().cloneWithRowsAndSections(lRes),
      foreignDataSource: this._createDataSource().cloneWithRowsAndSections(fRes),
      isLocal: true,
      selectedCityId: null
    };

    setInterval(() => {
      this.setState( { locationState: !this.state.locationState} );
    }, 5000);

    console.log(this.state.s, this.state['s']);
    console.log(this.state[s]);
  }

  componentWillMount() {
    if (this.state.isSupport) {
      this.setState({ selectedCityId: locationCity.cityId });
    }
  }

  /**
   * 新建dataSource
   *
   * @returns {ListView.DataSource}
   * @private
   */
  _createDataSource() {
    return(
      new ListView.DataSource({
        rowHasChanged: (r1, r2) => r1 !== r2,
        sectionHeaderHasChanged: (s1, s2) => s1 !== s2
      })
    );
  }

  /**
   * 更新dataSource
   *
   * @param isLocal - 是否为国内
   * @param res
   * @private
   */
  _updateDataSource(isLocal, res) {
    let dsName = isLocal ? 'localDataSource' : 'foreignDataSource';
    this.state[dsName] = this.state[dsName].cloneWithRowsAndSections(res);
  }

  /**
   * 点击定位栏事件
   *
   * @param isSuccess - 定位是否成功
   * @private
   */
  _onPressLocationView(isSuccess) {
    if (isSuccess) {
      if (this.state.isSupport) {
        this._onPressRow(
          new MJCity({
            cityId: locationCity.cityId,
            cityName: locationCity.cityName,
            cityAleph: locationCity.cityAleph,
            selected: true
          }));
      }
    } else {
      AlertIOS.prompt('', '定位失败', null, null, '');
    }
  }

  /**
   * 点击row事件
   *
   * @param rowData
   * @private
   */
  _onPressRow(rowData) {
    let selectedCityId = rowData.cityId;
    let res = this._getListViewData(this.state.isLocal, selectedCityId);

    this._updateDataSource(this.state.isLocal, res);

    this.setState({
      selectedCityId: selectedCityId
    });
  }

  /**
   * 点击国内国外按钮
   *
   * @param isLocal
   * @private
   */
  _onPressLocal(isLocal) {
    if (isLocal !== this.state.isLocal) {
      // let startListView = isLocal ? this.refs.local : this.refs.foreign;
      let selectedCityId = this.state.selectedCityId;
      let res = this._getListViewData(isLocal, selectedCityId);

      this._updateDataSource(isLocal, res);

      this.setState( {
        isLocal: isLocal
      } );

      let listview = isLocal ? this.refs[localListViewName] : this.refs[foreignListViewName];
      listview.scrollTo({y: 0, x: 0, animated: true});

      let width = isLocal ? 0 : WINDOW_WIDTH;
      this.refs.scrollView.scrollTo({y: 0, x: width, animated: false});
    }
  }

  /**
   * 数据处理
   *
   * 默认的提取函数可以处理下列形式的数据:
   *
   * { sectionID1: { rowID_1: rowData1, ... }, ... }
   *
   * 或者：
   *
   * { sectionID_1: [ rowData1, rowData2, ... ], ... }
   *
   * 或者：
   *
   * [ [ rowData1, rowData2, ... ], ... ]
   */
  _getListViewData(isLocal, selectedCityId) {
    var dataBlob = {};
    let sectionArr = isLocal ? localSectionArr : foreignSectionArr;
    let cityData=  isLocal ? localData : foreignData;

    sectionArr.forEach( (sectionItem) => {
      dataBlob[sectionItem] = [];
    } );

    cityData.forEach( (city) => {
      dataBlob[city.cityAleph].push(
        new MJCity({
          cityId: city.cityId,
          cityName: city.cityName,
          cityAleph: city.cityAleph,
          selected: (city.cityId === selectedCityId)
        })
      );
    } );

    return dataBlob;
  }

  /**
   * 计算每个索引对应的y值
   *
   * @param id
   * @returns 点击索引时scrollTo中的y值
   */
  _calculateMinY(id) {
    let dataBlob = this.state.isLocal ? this.state.localDataSource._dataBlob : this.state.foreignDataSource._dataBlob;
    var heights = [];
    var minY = [];
    var totalHeight = 0; // 列表总高度
    let sectionArr = this.state.isLocal ? localSectionArr : foreignSectionArr;

    /// 获取每个section的高度
    sectionArr.forEach( (sectionItem) => {
      let rows = dataBlob[sectionItem];
      let h = rows.length * rowHeight + sectionHeight;
      heights.push(h);
      /// 计算总高度
      totalHeight = totalHeight + h;
    } );

    minY.push(0); /// 第一个section的y为0
    for (let i = 1; i < heights.length; i++) {
      let y = minY[i-1] + heights[i-1];
      /// 最大Y值
      let remainY = totalHeight - (WINDOW_HEIGHT - containerTop - locationViewHeight);
      /// 取小
      let min = (remainY < y) ? remainY : y;
      minY.push(min);
    }

    if (id < 0 || id >= minY.length) {
      return 0;
    }
    return minY[id];
  }

  /**
   * 渲染 定位视图域
   *
   * @returns {XML}
   * @private
   */
  _renderLocationView() {
    let locationDes = this.state.isSupport ? '定位城市' : '当前城市不支持';
    return (
      <TouchableWithoutFeedback onPress={ () => this._onPressLocationView(this.state.locationState) } >
        <View style={ styles.locationView } >
          {
            this.state.locationState ?
              <View style={ styles.cityNameView } >
                <Text style={ styles.cityNameText } > { locationCity.cityName } </Text>
                <Text style={ [{flex: 1}, styles.locationDes] } > { locationDes } </Text>
                {
                  (this.state.selectedCityId === locationCity.cityId) ?
                    <Image source={require('./assets/list_check.png')} /> :
                    null
                }
              </View>
              :
              <View style={ styles.locationFail } >
                <Text style={ styles.locationDes } >
                  定位失败，请在系统设置中打开定位服务
                </Text>
              </View>
          }
        </View>
      </TouchableWithoutFeedback>
    );
  }

  /**
   * 渲染 row
   *
   * @param rowData
   * @returns {XML}
   * @private
   */
  _renderRow(rowData) {
    return (
      <TouchableWithoutFeedback onPress={ () => this._onPressRow(rowData) } >
        <View style={ styles.cityRow } >
          <View style={ styles.cityNameView } >
            <Text style={ [styles.cityNameText, {flex: 1}] } > { rowData.cityName } </Text>
            {
              (rowData.selected) ?
                <Image source={require('./assets/list_check.png')} /> :
                null
            }
          </View>
          <View style={ styles.cityLine } />
        </View>
      </TouchableWithoutFeedback>
    );
  }

  /**
   * 渲染 section
   *
   * @param sectionID
   * @returns {XML}
   * @private
   */
  _renderSectionHeader(sectionID){
    return (
      <View style={ styles.citySection } >
        <View style={ styles.cityAlephView} >
          <Text style={ styles.cityAlephText } > { sectionID } </Text>
        </View>
        <View style={ styles.cityLine} />
      </View>
    )
  }

  /**
   * 渲染 首字母索引
   *
   * @param isLocal
   * @returns {XML}
   * @private
   */
  _renderSectionList(isLocal) {
    let dataSource = isLocal ? this.state.localDataSource : this.state.foreignDataSource;
    return (
      <View style={ styles.flowView } >
        {
          dataSource.sectionIdentities.map((sectionTitle, id) => {
            var y = this._calculateMinY(id);
            return (
              <TouchableOpacity
                key={id}
                style={ styles.sectionListItem }
                onPress={ () => {
                  let listview = isLocal ? this.refs[localListViewName] : this.refs[foreignListViewName];
                  listview.scrollTo({y: y, x: 0, animated: true});
                 } }
              >
                <Text style={ styles.sectionListText }> { sectionTitle } </Text>
              </TouchableOpacity>
            );
          })
        }
      </View>
    );
  }

  /**
   * 渲染 列表视图
   *
   * @param isLocal
   * @returns {XML}
   * @private
   */
  _renderListView(isLocal) {
    let dataSource = isLocal ? this.state.localDataSource : this.state.foreignDataSource;
    return (
      <View style={ styles.listView } >
        <ListView
          ref={(isLocal ? localListViewName : foreignListViewName)}
          dataSource={ dataSource }
          renderRow={ (rowData, sectionID, rowID) => this._renderRow(rowData) }
          renderSectionHeader={ (rowData, sectionID, rowID) => this._renderSectionHeader(sectionID) }
          automaticallyAdjustContentInsets={ false }
          scrollsToTop={ true }
          overflow={ 'hidden' }
        />
        {
          this._renderSectionList(isLocal)
        }
      </View>
    );
  }

  /**
   * 渲染 国内国外选择域
   *
   * @returns {XML}
   * @private
   */
  _renderLocalForeignView() {
    let localColor = this.state.isLocal ? 'white' : 'rgb(191, 196, 211)';
    let foreignColor = this.state.isLocal ? 'rgb(191, 196, 211)' : 'white';
    return(
      <View style={ styles.flowView } >
        <View style={ styles.localForeignView } >
          <TouchableOpacity
            style={ [styles.localForeignButton, {marginRight: 20}] }
            onPress={ () => this._onPressLocal(true) }
          >
            <Text style={ [styles.localForeignText, {textAlign: 'right', color: localColor}] } > 国内 </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={ [styles.localForeignButton, {marginLeft: 20}] }
            onPress={ () => this._onPressLocal(false) }
          >
            <Text style={ [styles.localForeignText, {textAlign: 'left', color: foreignColor}] } > 国外 </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  render() {
    return (
      <View style={ styles.container } >
        {
          this._renderLocationView()
        }
        <ScrollView
          ref='scrollView'
          horizontal={true}
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
        >
          {
            this._renderListView(true)
          }
          {
            this._renderListView(false)
          }

        </ScrollView>
        {
          this._renderLocalForeignView()
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: containerTop
  },
  locationView: {
    height: locationViewHeight,
    backgroundColor: 'rgb(247, 247, 247)'
  },
  locationDes: {
    fontSize: 12,
    color: 'rgb(162, 162, 162)'
  },
  locationFail: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 20
  },

  /// 包含列表和索引
  listView: {
    width: WINDOW_WIDTH,
    flexDirection: 'row'
  },

  cityRow: {
    height: rowHeight,
    backgroundColor: 'white'
  },
  citySection: {
    height: sectionHeight,
    backgroundColor: 'white'
  },
  cityLine: {
    height: 0.5,
    backgroundColor: 'rgb(243, 243, 243)'
  },

  cityAlephView: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10
  },
  cityAlephText: {
    fontSize: 12,
    color: 'rgb(162, 162, 162)'
  },

  /// 包含 城市名Text 和 选中图片
  cityNameView: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    marginRight: 40
  },
  cityNameText: {
    fontSize: 16,
    color: 'rgb(31, 31, 31)'
  },

  flowView: {
    flex: 0.001,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sectionListItem: {
    width: 20,
    height: 16,
    backgroundColor: 'transparent',
    left: -21,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sectionListText: {
    fontSize: 12,
    color: 'rgb(162, 162, 162)'
  },

  localForeignView: {
    flex: 1,
    width: 180,
    height: 32,
    borderRadius: 50,
    backgroundColor: 'rgba(31, 31, 31, 0.9)',
    top: -36,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  localForeignButton: {
    width: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center'
  },
  localForeignText: {
    fontSize: 15,
    color: 'white'
  }
});

AppRegistry.registerComponent('HelloWorldApp', () => HelloWorldApp);
