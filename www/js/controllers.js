angular.module('app.controllers', ['angular-md5','tagged.directives.infiniteScroll'])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});
  $scope.$on('$ionicView.enter', function(e) {
    console.log("Entro en el evento $ionicView.enter del AppCtrl");
    $scope.myData = {
      id: localStorage.getItem("user_id"),
      username: localStorage.getItem("user_username"),
      name: localStorage.getItem("user_name"),
      public: localStorage.getItem("user_public")
    };
  });
  // Form data for the login modal
  $scope.loginData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.modal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.modal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.modal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    console.log('Doing login', $scope.loginData);

    // Simulate a login delay. Remove this and replace with your login
    // code if using a login system
    $timeout(function() {
      $scope.closeLogin();
    }, 1000);
  };

})

.controller('loginCtrl', function($scope, $state, md5,$http,$ionicSideMenuDelegate){

  if(localStorage.getItem("user_id") != null){
    $state.go('tab.inicio');
  }else{

  $ionicSideMenuDelegate.canDragContent(false);
  $scope.user = {};
  $scope.enviar = function(){
    if ($scope.user.username == null || $scope.user.password == null) {
      $scope.showerror = true;
      $scope.errormsg = "Tienes que rellenar los campos.";
    } else {
      $scope.showerror = false;
      var pswd = md5.createHash($scope.user.password || '');

      $json_post = {
        user_name: $scope.user.username,
        user_pswd: pswd,
      };

      console.log($scope.user.username);
      console.log(pswd);

      //Enviar post
      $http.post('https://lgbt-api.herokuapp.com/v1/users/login', $json_post)
        .success(function(data) {
          if (data.success == true) {
            console.log("Correcto");
            console.log(data);

            //LocalStorage de Cordova
            localStorage.setItem("user_id", data.data.id);
            localStorage.setItem("user_username", data.data.username);
            localStorage.setItem("user_name", data.data.name);
            localStorage.setItem("user_token", data.token);
            localStorage.setItem("user_public", data.data.public);

            /*$localStorage.user_id = data.data.id;
            $localStorage.user_username = data.data.username;
            $localStorage.user_bio = data.data.bio;
            $localStorage.token = data.token;

            $json_post2 = { firebase_token: firebase_token }*/
            //Guardar el firebase_token en la bd
            $state.go('tab.inicio');

          } else {
            //Mostrar mensaje de error
            $scope.showerror = true;
            $scope.errormsg = "No coincide el nombre de usuario y la contraseña.";
          }
        })
        .error(function(data) {
          console.log("Error " + data);
        });
    }
  };

  $scope.fbLoginSuccess = function (userData) {
    console.log("UserInfo: ", userData);
    facebookConnectPlugin.getAccessToken(function(token) {
      console.log("Token: " + token);
    });
    facebookConnectPlugin.api("/me?fields=id,name,email,picture", ["public_profile", "email"], function(response) {
          console.log(response.id + " | " + response.name + " | " + response.email + " | ");
          $json_post = {
            email: response.email,
            name: response.name,
          };
          //Buscar el email en la bd
          $http.post(BASE_URL+'/users/login/facebook', $json_post).then(function(res){

              //LocalStorage de Cordova
              localStorage.setItem("user_id", res.data.data.id);
              localStorage.setItem("user_username", res.data.data.username);
              localStorage.setItem("user_token", res.data.token);
              localStorage.setItem("user_public", res.data.data.public);

              $state.go('tab.inicio');
          }, function(error){
            console.log(error);
          });
      },function(err){console.log(err);});
  };

  $scope.loginFacebook = function(){
    facebookConnectPlugin.login(["public_profile"], $scope.fbLoginSuccess,
      function loginError (error) {
        console.error(error)
      }
    );
  };

  $scope.loginGoogle = function() {

    window.plugins.googleplus.login(
      {
        'scopes': '', // optional, space-separated list of scopes, If not included or empty, defaults to `profile` and `email`.
        'webClientId': '', // optional clientId of your Web application from Credentials settings of your project - On Android, this MUST be included to get an idToken. On iOS, it is not required.
        'offline': false, // optional, but requires the webClientId - if set to true the plugin will also return a serverAuthCode, which can be used to grant offline access to a non-Google server
      },
      function (obj) {
        alert(JSON.stringify(obj)); // do something useful instead of alerting
      },
      function (msg) {
        alert('error: ' + msg);
      }
    );
  };


  } //Fin else
})

.controller('regCtrl', function($scope,$http,md5) {
  $scope.user = {};
  $scope.enviar = function() {
    if ($scope.user.username == null || $scope.user.password == null || $scope.user.password2 == null || $scope.user.email == null) {
      $scope.errormsg = "Es necesario rellenar todos los campos.";
    } else {
      //Comprobar que coinciden las dos contraseñas
      if ($scope.user.password == $scope.user.password2) {
        //Enviar post
        var pswd = md5.createHash($scope.user.password || '');
        $json_post = {
          user_name: $scope.user.username,
          user_pswd: pswd,
          user_email: $scope.user.email
        };

        //Enviar post
        $http.post(BASE_URL+'/users', $json_post).then(function(response){
          if (response.data.success == true) {
            console.log("Registro correcto");
            console.log(response);

            //Redirigir a main.home
            $state.go('login');
          } else {
            console.log("Registro incorrecto.");
            console.log(response);
          }
        },function(error){

        });

      } else {
        $scope.errormsg = "Las contraseñas no coinciden.";
      }
    }
  };
})

.controller('inicioCtrl', function($scope, $http,$ionicSideMenuDelegate, $stateParams) {
  $ionicSideMenuDelegate.canDragContent(true);
  $scope.last = new Date().toISOString();
  $scope.posts = [];
  $scope.consultar = false;
  $scope.desactivar = false; //Deshabilitar llamadas a la api si no hay más datos
  $scope.com = {};

  $scope.cargarPosts = function() {

    if($scope.posts.length>0)
      $scope.last = $scope.posts[$scope.posts.length-1].created_time;

    if(!$scope.consultar){
      $scope.consultar = true;

      $http.get(BASE_URL+'/posts?after='+$scope.last).then(function(response){
          console.log(response);
          if(response.data.data.length>0)
            $scope.posts = $scope.posts.concat(response.data.data);
          else {
            $scope.desactivar = true;
          }
      }, function(error){
          //there was an error fetching from the server
          console.log(error);
      });

    }
  };

  $scope.refrescarPosts = function() {
    $scope.last = new Date().toISOString();
    $http.get(BASE_URL+'/posts?after='+$scope.last).then(function(response){
      console.log(response);
      $scope.posts = response.data.data;
      $scope.$broadcast('scroll.refreshComplete');
      }, function(error){
          //there was an error fetching from the server
          console.log(error);
      });
  };

  $scope.cargarPosts();

  $scope.cargarPost = function() {
    $http.get(BASE_URL+'/posts/'+$stateParams.id).then(function(response){
      $scope.post = response.data.data;
      console.log(response);
    }, function(error){
        console.log("Error: "+error);
    });
  };

  $scope.likePost = function() {
    var url = '/posts/' + $stateParams.id + '/likes';
    $http.post(BASE_URL + url).then(function(response){
      if(response.data.success){
        $scope.count = response.data.count;
        $scope.cargarPost();
      }
    },function(error){
      console.log(error);
    });
  };

  $scope.comentarPost = function() {

    $json_post = {target_id: $stateParams.id, content: $scope.com.texto};
    var url = '/posts/' + $stateParams.id + '/comments';

    $http.post(BASE_URL + url, $json_post).then(function(response){
      if(response.data.success){
        $scope.com.texto = "";
        $scope.cargarPost();
      }
    },function(error){
      console.log(error);
    });
  };

})

.controller('calendarioCtrl', function($scope, $http, $stateParams) {
  $scope.mes = 0; //Es el nombre del mes
  $scope.anyo = 0; //El año: 2017
  $scope.eventos = [];
  $scope.sineventos = false;
  $scope.com = {};

  $scope.cargarEventos = function() {
    var hoy = new Date();
    var url = '/events?month='+ hoy.getMonth() + '&year=' + hoy.getFullYear();
    $http.get(BASE_URL+url).then(function(response){
      if(response.data.success == true){
        //Comprobar si hay eventos el mes consultado
        if(response.data.data.length==0)
          $scope.sineventos = true;
        else $scope.sineventos = false;
        //Asignar los datos
        $scope.mes = MESES[hoy.getMonth()];
        $scope.anyo = hoy.getFullYear();
        $scope.eventos = response.data.data;
      }
    }, function(error){
      console.log("Error");
    });
  };

  $scope.cambiarMes = function(next) {
    var m = MESES.indexOf($scope.mes); //Si es febrero m = 1, hay que aumentar este valor
    if(next){
      if(m == 11){
        //Siguiente mes
        //Si es diciembre pasa a ser enero del año siguiente
        m = 0;
        $scope.anyo += 1;
      }else{
        m++;
      }

    }else{
      //Mes anterior
      if(m == 0){
        //Si es enero pasa a ser diciembre del año anterior
        m = 11;
        $scope.anyo -= 1;
      }else m--;
    }


    var url = '/events?month='+ m + '&year=' + $scope.anyo;
    $http.get(BASE_URL + url).then(function(response){
      if (response.data.success == true) {
        console.log("Events cargados");
        console.log(response.data);
        if(response.data.data.length == 0)
          $scope.sineventos = true;
        else $scope.sineventos = false;

        $scope.mes = MESES[m];
        $scope.eventos = response.data.data;
      }
    },function(error){
        console.log("Error: "+error);
    });
  };

  $scope.cargarEvento = function(){
    $scope.evento = {};
    $http.get(BASE_URL+'/events/'+$stateParams.id).then(function(response){
      if(response.data.success){
        console.log(response.data);
        $scope.evento = response.data.data;
      }
    },function(error){

    });
  };

  $scope.comentar = function() {

    $json_post = {target_id: $stateParams.id, content: $scope.com.texto};
    var url = '/events/' + $stateParams.id + '/comments';

    $http.post(BASE_URL + url, $json_post).then(function(response){
      if(response.data.success) {
        $scope.com.text="";
        $scope.cargarEvento();
      }
    },function(error){
      console.log(error);
    });
  };

  $scope.asistir = function(num) {
    if(num==1) var url = '/events/' + $stateParams.id + '/assist';
    else var url = '/events/' + $stateParams.id + '/interested';

    //update campo de asistencia al evento
    //Si está marcado el de interesado tiene que eliminarlo
    $json_post = { user_id: localStorage.user_id };

    //Enviar post
    $http.post(BASE_URL + url, $json_post).then(function(response){
      if(response.data.success)
        console.log("Correcto.");
        cargarEvento();
    },function(error){
      console.log(error);
    });
  };

  $scope.cargarLista = function() {
    $scope.lista = [];
    if($stateParams.caso == "interesados")
      var url = '/events/'+ $stateParams.id +'/interested';
    else if($stateParams.caso == "asistentes")
      var url = '/events/'+ $stateParams.id +'/assist';
    
    $http.get(BASE_URL+url).then(function(response){
      if(response.data.success){
        $scope.lista = response.data.data;
        console.log($scope.lista);
      }
    },function(error){
      console.log(error);
    });

  };
})

.controller('canalesCtrl', function($scope, $http, $stateParams) {
  $scope.miscanales = [];
  $scope.canales = [];
  $scope.suscBtn = "Suscribirme";

  $scope.cargarCanales = function() {
    $http.get(BASE_URL+'/channels').then(function(response){
      if(response.data.success){
        $scope.canales = response.data.data;
      }
    },function(error){

    });
  };

  $scope.misCanales = function() {
    $http.get(BASE_URL+'/me/channels').then(function(response){
      if(response.data.success){
        console.log(response);
        $scope.miscanales = response.data.data;
      }
    },function(error){

    });
  };

  $scope.cargarCanal = function() {
    $scope.canal = {};
    $http.get(BASE_URL+'/channels/'+$stateParams.id).then(function(response){
      if(response.data.success){
        console.log(response.data.data);
        $scope.canal = response.data.data;
        //Si estoy suscrita cambiar el mensaje del botón
        if($scope.canal.susc.indexOf(localStorage.user_id)==-1)
          $scope.suscBtn = "Suscribirme";
        else
          $scope.suscBtn = "Eliminar suscripción";
      }
    },function(error){

    });
  };

  $scope.suscCanal = function() {

    var url = '/channels/' + $stateParams.id + '/suscribe';
    //Enviar post
    $http.post(BASE_URL + url).then(function(response){
      if(response.data.success){
        //Cambiar el mensaje del botón
        if($scope.suscBtn=="Suscribirme")
          $scope.suscBtn = "Eliminar suscripción";
        else
          $scope.suscBtn = "Suscribirme";
      }
    },function(error){
      console.log(error);
    });
    
  };

  $scope.notifCanal = function() {

    $json_post = { user_id: localStorage.user_id };
    var url = '/channels/' + $stateParams.id + '/notifications';
    //Enviar post
    $http.post(BASE_URL + url, $json_post).then(function(response){
      console.log("Notificaciones modificadas correctamente");
      //Mostrar el icono o no de silencio
    },function(error){
      console.log(error);
    });
  };
})

.controller('perfilCtrl', function($scope, $stateParams,$http,$state,$ionicLoading) {
  $scope.usuario = {};

  //Función para mostrar (o no) funcionalidades
  $scope.soyYo = function(id){
    if(id != localStorage.user_id){
      return false;
    }else return true;
  };

  //Cargar datos en el perfil de un usuario
  $scope.cargarUsuario = function() {
    $ionicLoading.show({
         template: '<ion-spinner icon="spiral"></ion-spinner>'
    });
    $scope.mostrarAct = false;

    $http.get(BASE_URL+'/users/'+$stateParams.id).then(function(response){
      console.log(response);
      $scope.usuario = response.data.data;

      //Obtener la relación con el otro usuario si no estoy cargando mi perfil
      if(!$scope.soyYo($stateParams.id)){
        $http.get(BASE_URL+'/users/' + $stateParams.id + '/relationship').then(function(response2){
          if(response2.data.success){
            //Mostrar o no la actividad (si el usuario tiene el perfil privado)
            if($scope.usuario.public == false && response2.data.data.outgoing == "follows"){
              $scope.mostrarAct = true;
            }
            //Ver qué debe de poner en el botón de seguir
            if(response2.data.data.outgoing == "follows") $scope.botonMsg = "Siguiendo";
            else if(response2.data.outgoing == "requested") $scope.botonMsg = "Solicitado";
            else if(response2.data.outgoing == "none" && $scope.usuario.public==false) $scope.botonMsg = "Solicitar seguir";

            $ionicLoading.hide();
          }
        },function(error2){
          console.log("Eerrorrr");
        });
      }
      $scope.mostrarAct = true;
      $ionicLoading.hide();
    }, function(error){
      console.log(error);
    });
  };

  $scope.cargarLista = function() {
    $scope.lista = [];
    var botonMsg = "Seguir";
    if($stateParams.caso == "siguiendo"){
      var url = '/users/'+ $stateParams.id +'/follows';
    }else if($stateParams.caso == "seguidores"){
      var url = '/users/'+ $stateParams.id +'/followed-by';
    }else if($stateParams.caso == "peticiones"){
      var url = '/requests';
    }

    var j = 0;
    $http.get(BASE_URL+url).then(function(response){
      console.log(response);
      if($stateParams.caso != "peticiones" && response.data.data.length>0 && !$scope.soyYo($stateParams.id)){ //Si son seguidores/seguidos de otro usuario
        for(var i=0; i<response.data.data.length; i++){
          //Obtener la relación entre ese usuario y yo
          var url = BASE_URL + '/users/' + response.data.data[i].id + '/relationship';
        
          $http({
            method: "GET",
            url: url
          }).then(function success(data2){
            
            if(j<i){
              if(data2.data.data.outgoing == "follows") botonMsg = "Siguiendo";
              else if(data2.data.data.outgoing == "requested") botonMsg = "Solicitado";
              else if(data2.data.data.outgoing == "none" && response.data.data[j].public==false) botonMsg = "Solicitar seguir";

              $scope.lista.push({
                user: response.data.data[j],
                relwithme: botonMsg
              });
              j++;
            }

          });

      }//Fin for

      }else if($stateParams.caso!="peticiones" && response.data.data.length>0 && $scope.soyYo($stateParams.id)){
        for(var i in response.data.data){
          //Ver qué debe de poner en el botón de seguir
          if(response.data.data[i].outgoing_status == "follows") botonMsg = "Siguiendo";
          else if(response.data.data[i].outgoing_status == "requested") botonMsg = "Solicitado";
          else if(response.data.data[i].outgoing_status == "none" && response.data.data[i].user_data.public==false) botonMsg = "Solicitar seguir";

          $scope.lista.push({
            user: response.data.data[i],
            relwithme: botonMsg
          });
        }//Fin for
        console.log("Lista: ");
        console.log($scope.lista);
      }
    },function(error){
      console.log("Error cargando la lista de usuarios.");
    });
  };

  $scope.seguirUsuario = function() {
    var accion = "follow"; //accion por defecto: seguir

    if($scope.botonMsg == "Solicitar seguir"){
      accion = 'request';
      $scope.botonMsg = "Solicitado";
    }else if($scope.botonMsg == "Siguiendo"){
      accion = 'unfollow';
      $scope.botonMsg = 'Seguir';
    }else if($scope.botonMsg == "Seguir"){
      $scope.botonMsg = "Siguiendo";
    }

    $json_post = { action: accion }; //valores: follow || request || unfollow || approve || ignore
    //Enviar post
    $http.post(BASE_URL + '/users/'+ userid +'/relationship',$json_post).then(function(response){
      if(response.data.success){
        console.log("Acción realizada correctamente.");
      }
    }, function(error){
      console.log(error);
    });
  };

  $scope.aceptarPeticion = function(bool,userID) {
    var accion = 'approve';
    if(!bool) accion = 'ignore';

    $json_post = { action: accion }; 
    //Enviar post
    $http.post(BASE_URL + '/users/'+ userID +'/relationship',$json_post).then(function(response){
      if(response.data.success)
        $scope.cargarLista();
    },function(error){
      console.log(error);
    });
  };

  $scope.editarUsuario = function() {

    $json_post = {

    };

    $http.post(BASE_URL+'/users/'+ localStorage.user_id).then(function(response){

    },function(error){

    });
  };

  $scope.win = function (r) {
    $ionicLoading.hide();
    console.log("Code = " + r.responseCode);
    alert("Response = " + r.response);
    console.log("Sent = " + r.bytesSent);
  };

  $scope.fail = function (error) {
      alert("An error has occurred: Code = " + error.code);
      console.log("upload error source " + error.source);
      console.log("upload error target " + error.target);
  };

  $scope.onSuccess = function(imageURI) {
    var image = document.getElementById('picture');

    $ionicLoading.show({template: 'Enviando la imagen...'});
    var options = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = imageURI.substr(imageURI.lastIndexOf('/') + 1);
    options.mimeType = "image/jpeg";
    options.chunkedMode = false;

    var params = {};
    params.api_key = "479641643612759";
    params.timestamp = Math.floor(Date.now() / 1000);
    params.upload_preset = 'eix6ihmq';

    options.params = params;

    var ft = new FileTransfer();
    ft.upload(imageURI, encodeURI("https://api.cloudinary.com/v1_1/tfg-lgbt-cloud/image/upload/"), $scope.win, $scope.fail, options,true);
  };

  $scope.onFail = function(message) {
        alert('Failed because: ' + message);
  };

  $scope.cargarImagen = function() {
    navigator.camera.getPicture($scope.onSuccess, $scope.onFail, { quality: 50,
        destinationType: Camera.DestinationType.FILE_URI, sourceType: navigator.camera.PictureSourceType.SAVEDPHOTOALBUM });
  };

})

.controller('activCtrl', function($scope,$http){
  $scope.actividad = [];
  $scope.consultar = false;
  $scope.desactivar = false;

  $scope.cargarActiv = function(){
    if($scope.actividad.length==0)
      $scope.ultima = new Date().toISOString();
    else
      $scope.ultima = $scope.actividad[$scope.actividad.length-1].created_time;

    var url = BASE_URL + '/activity?after=' + $scope.ultima;

    if(!$scope.consultar){
      $scope.consultar = true;
      $http.get(url).then(function(response){
        console.log(response);
        $scope.consultar = false;
        if(response.data.success){
          if(response.data.data.length>0)
            $scope.actividad = $scope.actividad.concat(response.data.data);
          else {
            $scope.desactivar = true;
          }
      }
    },function(error){
      console.log(error);
    });

  }
  };

})

.controller('configCtrl', function($scope, $stateParams,$state) {

  $scope.fontSize = function() {

  };

  $scope.perfilPrivado = function(){
    $http.post(BASE_URL+'/users/edit').then(function(response){

    }, function(error){
      console.log(error);
    });
  };

  $scope.cerrarSesion = function() {
    localStorage.clear();
    $state.go('login');
  };
});