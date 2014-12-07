angular.module('PersonalSiteApp', ['ngRoute'])
 /*.factory('companyList', function ($http) {
     var dataset = { data:null};
     var currentcompany ={data: null}
     var currentId = 1;
     var dataService = {};
     
     $http.get("data/data.json").success(function (data, status, headers, config) {
        dataset.data = data;
        currentcompany.data = data[currentId];
     });
     dataService.getCompanies = function () {
         return dataset;
     }
     dataService.getDetails = function(id){
        currentId = id;
        if(dataset.data){            
            currentcompany.data = $.grep(dataset.data,function(a){ return a.id == id;});
            if(currentcompany.data)
            {
                currentcompany.data=currentcompany.data[0];
            }
        }
        return currentcompany;
     }
    return dataService;
  })*/
.config(['$routeProvider', function ($routeProvider) {
     $routeProvider
       .when('/', {
            templateUrl: '/coverView.html',
            controller: 'coverCtrl'
        })
       .when('/about', {
           templateUrl: '/aboutView.html',
           controller: 'aboutCtrl'
        })
       .when('/portfolio', {
           templateUrl: '/portfolioView.html',
           controller: 'portfolioCtrl'
        })
       .otherwise({
            redirectTo: '/'
       });
 }])
.controller('coverCtrl', function ($scope, $filter, $http) { 
    var w = $(window);
    ResizeElements();

    $scope.PaintIn = function(){
      angular.element('.highlight').stop().animate({ width: '100%' },500);
    }

    $scope.PaintOut = function(){
      angular.element('.highlight').stop().animate({ width: '0%' },500);
    }

    w.bind('resize', function () {
        ResizeElements();
        $scope.$apply();
    });

    
    function ResizeElements(){
       $scope.winHeight = w.height();
       angular.element('#imgs img').width(angular.element('#imgs').width()+'px');
    }
});
