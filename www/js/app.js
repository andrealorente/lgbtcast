// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
const BASE_URL = 'https://lgbt-api.herokuapp.com/v1';
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

angular.module('app', ['ionic', 'app.controllers','angularMoment','ion-floating-menu'])

.run(function($ionicPlatform,amMoment) {
  
  amMoment.changeLocale('es');

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider, $httpProvider) {
  $stateProvider

    .state('login', {
      url: '/login',
      views: {
        'content': {
          templateUrl: 'templates/login.html',
          controller: 'loginCtrl'
        }
      }

    })

    .state('registro',{
      url: '/registro',
      views: {
        'content': {
          templateUrl: 'templates/registro.html',
          controller: 'regCtrl'
        }
      }
    })

    // setup an abstract state for the tabs directive
    .state('tab', {
      url: '/tab',
      abstract: true,
      views: {
        'content': {
          templateUrl: 'templates/tabs.html'
        }
      }
    })

  .state('tab.inicio', {
    url: '/inicio',
    views: {
      'tab-inicio': {
        templateUrl: 'templates/inicio.html',
        controller: 'inicioCtrl'
      }
    }
  })

  .state('tab.calendario', {
    url: '/calendario',
    views: {
      'tab-calendario': {
        templateUrl: 'templates/calendario.html',
        controller: 'calendarioCtrl'
      }
    }
  })

  .state('tab.canales', {
    url: '/canales',
    views: {
      'tab-canales': {
        templateUrl: 'templates/canales.html',
        controller: 'canalesCtrl'
      }
    }
  })

  .state('tab.explorar', {
    url: '/canales/explorar',
    views: {
      'tab-canales': {
        templateUrl: 'templates/explorar.html',
        controller: 'canalesCtrl'
      }
    }
  })

  .state('tab.actividad', {
    url: '/actividad',
    views: {
      'tab-actividad': {
        templateUrl: 'templates/actividad.html',
        controller: 'activCtrl'
      }
    }
  })

  .state('tab.publicacion',{
    url: '/inicio/:id',
    views: {
      'tab-inicio': {
        templateUrl: 'templates/publicacion.html',
        controller: 'inicioCtrl'
      }
    }
  })

  .state('tab.evento', {
    url: '/calendario/:id',
    views: {
      'tab-calendario': {
        templateUrl: 'templates/evento.html',
        controller: 'calendarioCtrl'
      }
    }
  })

  .state('tab.listas', {
    url: '/calendario/:id/:caso',
    views: {
      'tab-calendario': {
        templateUrl: 'templates/lista.html',
        controller: 'calendarioCtrl'
      }
    }
  })

  .state('tab.canal', {
    url: '/canales/:id',
    views: {
      'tab-canales': {
        templateUrl: 'templates/canal.html',
        controller: 'canalesCtrl'
      }
    }
  })

  .state('perfil', {
    url: '/perfil/:id',
    views: {
      'content': {
        templateUrl: 'templates/perfil.html',
        controller: 'perfilCtrl'
      }
    }

  })

  .state('lista', {
    url: '/perfil/:id/:caso',
    views: {
      'content': {
        templateUrl: 'templates/lista.html',
        controller: 'perfilCtrl'
      }
    }
  })

  .state('buscar', {
    url: '/buscar',
    views: {
      'content': {
        templateUrl: 'templates/buscar.html',
        controller: 'perfilCtrl'
      }
    }
  })

  .state('editar',{
    url:'/perfil/editar',
    views: {
      'content': {
        templateUrl: 'templates/editarPerfil.html',
        controller: 'perfilCtrl'
      }
    }
  })

    .state('configuracion', {
      url: '/config',
      views: {
        'content': {
          templateUrl: 'templates/configuracion.html',
          controller: 'configCtrl'
        }
      }

    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');

  // Intercepta las llamadas al backend añadiéndoles el token del usuario en el header del request
  $httpProvider.interceptors.push(['$q', '$injector', function($q, $injector) {
    return {
      'request': function(config) {
        config.headers = config.headers || {};
        if (window.localStorage.getItem("user_token")) {
          config.headers.Authorization = 'Bearer ' + window.localStorage.getItem("user_token");
        }
        return config;
      },
      'responseError': function(response) {

        var $state = $injector.get("$state");
        if (response.status === 401 || response.status === 403) {
          $state.go("login");
          window.localStorage.clear();
        }
        return $q.reject(response);
      }
    };
}]);


});
