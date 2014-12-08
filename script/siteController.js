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
})
.controller('aboutCtrl', function ($scope, $filter, $http) { 
    $http.get("data/resume.json").success(function (data, status, headers, config) {
        $scope.resume = data;
    });
    angular.element('.resume-section').click(function () {
      angular.element('.selected').removeClass('selected');
      angular.element(this).addClass('selected');
      angular.element('#displaywell')
        .html(angular.element(this).children('.section-body').html())
        .removeClass('hidden');
    });

    var w = $(window);
    $scope.winHeight = w.height();

    w.bind('resize', function () {
        $scope.winHeight = w.height();
        $scope.$apply();
    });
})
.controller('portfolioCtrl', function ($scope, $filter, $http) {   
  $http.get("data/worksamples.json").success(function (data, status, headers, config) {
        $scope.fullList = data;
        $scope.worksamples = data;
        $scope.categories = _.chain(data)
                  .pluck('categories')
                  .flatten()
                  .unique()
                  .value();
    });
   var w = $(window);
    $scope.winHeight = w.height();

    w.bind('resize', function () {
        $scope.winHeight = w.height();
        $scope.$apply();
    });
  $scope.filterByCategory = function (that) {
    if(!that){
      $scope.worksamples = $scope.fullList;
      return;
    }
    $scope.worksamples = _.filter($scope.fullList, function(story){
      return _.contains(story.categories, that.category);
    })    
  };
});