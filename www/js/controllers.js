angular.module('starter.controllers', [])

.constant('ApiEndpoint', {
  caiyun: 'http://localhost:8100/caiyun'
})

.filter('iconName', function() {
	return function(skycon) {
		var iconMap = {
			CLEAR_DAY: 'wi-day-sunny',
			CLEAR_NIGHT: 'wi-night-clear',
			PARTLY_CLOUDY_DAY: 'wi-day-sunny-overcast',
			PARTLY_CLOUDY_NIGHT: 'wi-night-cloudy',
			CLOUDY: 'wi-cloudy',
			RAIN: 'wi-rain',
			SLEET: 'wi-sleet',
			SNOW: 'wi-snow',
			WIND: 'wi-strong-wind',
			FOG: 'wi-fog'
		};
		return iconMap[skycon];
	}
})

.controller('DashCtrl', function($scope) {})

.controller('ChatsCtrl', function($scope, Points) {
  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  // $scope.chats = Chats.all();
  // $scope.remove = function(chat) {
  //   Chats.remove(chat);
  // };
	
	$scope.$on('$ionicView.enter', function(e) {
		Points.refresh();
	})
	
	$scope.$on('$ionicView.leave', function(e) {
		Points.save();
	})
	
	$scope.points = Points.all();
	$scope.remove = function(point) {
		Points.remove(point);
	}
})

.controller('ChatDetailCtrl', function($scope, $stateParams, Chats) {
  $scope.chat = Chats.get($stateParams.chatId);
})

.controller('AccountCtrl', function($scope) {
  $scope.settings = {
    enableFriends: true
  };
})

.controller('MapCtrl', function($scope, $ionicModal, Points) {
	var markers = [];
	var points = Points.all();
	
	$ionicModal.fromTemplateUrl('templates/tab-map-modal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
	
	$scope.curPoint = null;
	
	function refreshMarkers() {
		var points = Points.all();
		var newMarkers = [];
		for (var i = 0; i < points.length; i++) {
			var point = points[i];
			var marker = addMarker(point, point.name, false);
			newMarkers.push(marker)
		}
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(null);
		}
		markers = newMarkers;
		newMarkers = null;
	}
	
  $scope.$on('$ionicView.enter', function(e) {
		refreshMarkers();
  });
	
	$scope.$on('$ionicView.leave', function(e) {
		Points.save();
	});
	
	var map = new AMap.Map('amap', {
		//resizeEnable: true,
		//rotateEnable: true,
		//dragEnable: true,
		//zoomEnable: true,
		//设置可缩放的级别
		//zooms: [3,18],
		//传入2D视图，设置中心点和缩放级别
		view: new AMap.View2D({
			center: new AMap.LngLat(116.397428, 39.90923),
			zoom: 16
		})
	});
	
	map.plugin('AMap.Geolocation', function () {
		var geolocation = new AMap.Geolocation({
			enableHighAccuracy: true,//是否使用高精度定位，默认:true
			timeout: 10000,          //超过10秒后停止定位，默认：无穷大
			maximumAge: 0,           //定位结果缓存0毫秒，默认：0
			convert: false,           //自动偏移坐标，偏移后的坐标为高德坐标，默认：true
			showButton: true,        //显示定位按钮，默认：true
			buttonPosition: 'LB',    //定位按钮停靠位置，默认：'LB'，左下角
			buttonOffset: new AMap.Pixel(10, 20),//定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
			showMarker: true,        //定位成功后在定位到的位置显示点标记，默认：true
			showCircle: false,        //定位成功后用圆圈表示定位精度范围，默认：true
			panToLocation: true,     //定位成功后将定位到的位置作为地图中心点，默认：true
			zoomToAccuracy:true      //定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
		});
	  map.addControl(geolocation);
		geolocation.getCurrentPosition();
	})
	
	function findMarker(lng, lat) {
		for (var i = 0; i < points.length; i++) {
			var point = points[i];
			if (Math.abs(point.lng - lng) < 0.0005 && Math.abs(point.lat - lat) < 0.0005) {
				return point;
			};
		};
	}
	function removeMarker(lng, lat) {
		Points.remove(findMarker(lng, lat));
	};
	
	var clickLock = false;
	
	function addMarker(position, title, animation) {
		var marker = new AMap.Marker({				  
			icon: "http://webapi.amap.com/images/marker_sprite.png",
			position: new AMap.LngLat(position.lng, position.lat),
			clickable: true,
			title: title
		});
		if (animation) {
			marker.setAnimation("AMAP_ANIMATION_DROP");
		};
		marker.setMap(map);
		
		var pressTimer;
		
		AMap.event.addListener(marker, 'mousedown', function(e) {
			clickLock = false;
			pressTimer = window.setTimeout(function() {
				if (clickLock) {
					return;
				};
				clickLock = true;
				removeMarker(e.lnglat.getLng(), e.lnglat.getLat());
				refreshMarkers();
			},1000)
		});
		AMap.event.addListener(marker, 'mouseup', function(e) {
			clearTimeout(pressTimer)
		});
		AMap.event.addListener(marker, 'click', function(e) {
			if (clickLock) {
				return;
			};
			clickLock = true;
			$scope.curPoint = findMarker(e.lnglat.getLng(), e.lnglat.getLat());
			$scope.modal.show();
		});
		return marker;
	}
	
	AMap.event.addListener(map, 'click', function(e){
		if (clickLock) {
			clickLock = false;
			return;
		};
		$scope.curPoint = Points.create(e.lnglat.getLng(), e.lnglat.getLat(), '');
		$scope.modal.show();
		var marker = addMarker({
			lng: e.lnglat.getLng(),
			lat: e.lnglat.getLat()
		}, $scope.curPoint.name, true);
		markers.push(marker);
		Points.add($scope.curPoint);
		Points.refresh();
	});
	
})

.controller('MapModalCtrl', function($scope) {
});
