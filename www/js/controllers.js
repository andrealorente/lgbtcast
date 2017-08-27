angular.module('app.controllers', ['angular-md5','tagged.directives.infiniteScroll', 'btford.socket-io'])

.factory('socket',function(socketFactory){
  var myIoSocket = io.connect('https://lgbt-api.herokuapp.com');

  mySocket = socketFactory({
    ioSocket: myIoSocket
  });

  return mySocket;
})

.factory('ContadorMsg', function(){
  return {
    count: 0,
    increase: function(){
      this.count++;
    },
    decrease: function() {
      this.count--;
    }
  }
})

.controller('AppCtrl', function($scope, $ionicModal, $timeout, socket, ContadorMsg) {

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
      public: localStorage.getItem("user_public"),
      image: localStorage.getItem("user_image"),
      noleidos: ContadorMsg.count
    };

    setTimeout(function(){
      if(typeof FCMPlugin != 'undefined'){
      FCMPlugin.onNotification(function(data){
        ContadorMsg.increase();
        if(data.wasTapped){
          //Notification was received on device tray and tapped by the user.
          alert(JSON.stringify(data));
        }else{
          //Notification was received in foreground. Maybe the user needs to be notified.
          alert(JSON.stringify(data));
        }
      });
      }
    }, 1000);

  });
  $scope.$on('$ionicView.beforeEnter', function (event, viewData) {
    viewData.enableBack = true;
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

  //Esto no sé si iría aquí
  /*FCMPlugin.onNotification(function(data){
    if(data.wasTapped){
      //Notification was received on device tray and tapped by the user.
      alert(JSON.stringify(data));
    }else{
      //Notification was received in foreground. Maybe the user needs to be notified.
      alert(JSON.stringify(data));
    }
  });*/

})

.controller('loginCtrl', function($scope, $state, md5,$http,$ionicSideMenuDelegate){

  if(localStorage.getItem("user_id") != null){
    $state.go('tab.inicio');
  }else{

  $ionicSideMenuDelegate.canDragContent(false);
  $scope.user = {};
  $scope.enviar = function(){
    if ($scope.user.username == null || $scope.user.password == null) {
      window.plugins.toast.showLongBottom('Tienes que rellenar los campos', function(a){
      console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
    } else {

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
            localStorage.setItem("user_image", data.data.image);

            FCMPlugin.getToken(function(token) {
              // save this server-side and use it to push notifications to this device
              alert(token);
              $json_post2 = { firebase_token: token };
              console.log(token);
              $http.post(BASE_URL+ '/firebase',$json_post2).then(function(response){
                console.log(response.data);
                if(response.data.success)
                  localStorage.setItem("user_firebase", response.data.data);
              },function(error){
                //Mostrar un Toast o algo
                console.log(error);
              });
            });
            //Guardar el firebase_token en la bd
            $state.go('tab.inicio');

          } else {
            //Mostrar mensaje de error
            window.plugins.toast.showLongBottom(data.error.message, function(a){
            console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
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

        if(res.data.success){
          //LocalStorage de Cordova
          localStorage.setItem("user_id", res.data.data.id);
          localStorage.setItem("user_username", res.data.data.username);
          localStorage.setItem("user_token", res.data.token);
          localStorage.setItem("user_public", res.data.data.public);
          localStorage.setItem("user_image", res.data.data.image);
          
          $state.go('tab.inicio');
        }else{
          window.plugins.toast.showLongBottom(res.data.error.message, function(a){
            console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
        }
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
        console.log(obj);
        $json_post = {
          email: obj.email, 
          name: obj.displayName,
          image: obj.imageUrl
        };

        $http.post(BASE_URL+'/users/login/google').then(function(response){

        }, function(error){

        });
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
      window.plugins.toast.showLongBottom('Es necesario rellenar todos los campos', function(a){
        console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
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
        window.plugins.toast.showLongBottom('Las contraseñas no coinciden', function(a){
        console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
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
      $scope.post.id = $stateParams.id;

      if($scope.post.likes.indexOf(localStorage.getItem("user_id"))==-1)
        $scope.liked = false;
      else $scope.liked = true;
      console.log(response);
    }, function(error){
        console.log("Error: "+error);
    });
  };

  $scope.likePost = function() {
    $scope.liked = !$scope.liked;
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

  $scope.cargarLista = function() { //De la gente que le ha dado like al post
    $scope.lista = [];

    var url = '/posts/' + $stateParams.id + '/likes?after='
    $http.get(BASE_URL+url).then(function(response){
      console.log(response.data);
      for(var i in response.data.data){
        $scope.lista.push({
          user: response.data.data[i],
          relwithme: 'hola'
        });
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
        $scope.evento.id = $stateParams.id;
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
        $scope.cargarEvento();
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
        console.log(response.data);
        for(var i in response.data.data){
          $scope.lista.push({
            user: response.data.data[i],
            relwithme: 'hola'
          });
        }
        
        console.log($scope.lista);
      }
    },function(error){
      console.log(error);
    });

  };
})

.controller('canalesCtrl', function($scope, $http, $stateParams, $ionicPopover, $ionicScrollDelegate, socket, $state) {
  $scope.miscanales = [];
  $scope.canales = [];
  $scope.suscBtn = "Suscribirme";

  socket.on('chat message', function(msg){ //Añadir los mensajes que te llegan
    alert(msg);
    console.log($state.current);
  });

  $scope.$on('$ionicView.beforeLeave', function() {
    if($state.current.name=="tab.canal")
      socket.emit('leave', $stateParams.id);
  });

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
        $scope.canal.id = $stateParams.id;
        //Si estoy suscrita cambiar el mensaje del botón
        if($scope.canal.susc.indexOf(localStorage.user_id)==-1)
          $scope.suscBtn = "Suscribirme";
        else
          $scope.suscBtn = "Eliminar suscripción";

        $ionicScrollDelegate.scrollBottom(true);

        //Join con los sockets en la sala del canal
        socket.emit('join', $stateParams.id);
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
        if($scope.suscBtn=="Suscribirme"){
          $scope.suscBtn = "Eliminar suscripción";
          
          //Suscribirme al topic del canal
          FCMPlugin.subscribeToTopic($stateParams.id, function(msg){
            console.log(msg);
            alert(msg);
          }, function(err){
            alert("Error");
            console.log("Error suscribiéndome al topic de firebase");
          });


        }else{
          $scope.suscBtn = "Suscribirme";
          socket.emit('leave', 'canal');
          FCMPlugin.unsubscribeFromTopic($stateParams.id, function(msg){
            console.log(msg);
            alert(msg);
          }, function(err){
            console.log("Error suscribiéndome al topic de firebase");
          });
          
        }
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

  $scope.cargarLista = function() { //De suscriptores
    $scope.lista = [];
    $http.get(BASE_URL+'/channels/'+ $stateParams.id + '/suscribers').then(function(response){
      for(var i in response.data.data){
        $scope.lista.push({
          user: response.data.data[i],
          relwithme: 'hola'
        });
      }
      console.log($scope.lista);
    }, function(error){
      console.log(error);
    });
  };

  $ionicPopover.fromTemplateUrl('templates/popover.html', {
    scope: $scope,
  }).then(function(popover) {
    $scope.popover = popover;
  });

})

.controller('perfilCtrl', function($scope, $stateParams,$http,$state,$ionicLoading,$ionicHistory) {
  $scope.usuario = {};
  $scope.datos = {};
  $scope.image = "";

  //Función para mostrar (o no) funcionalidades
  $scope.soyYo = function(id){
    if(id != localStorage.user_id){
      return false;
    }else return true;
  };

  $scope.cargarMisDatos = function() {
    
    $http.get(BASE_URL+'/users/'+ localStorage.getItem("user_id")).then(function(response){
      $scope.datos = response.data.data;
      console.log($scope.datos);
    }, function(error){
      console.log(error);
    });
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
          console.log(response2);
          if(response2.data.success){
            //Mostrar o no la actividad (si el usuario tiene el perfil privado)
            if($scope.usuario.public == false && response2.data.data.outgoing == "follows"){
              $scope.mostrarAct = true;
            }
            $scope.botonMsg = "Seguir";
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

              var user = {
                id: response.data.data[j].id,
                username: response.data.data[j].user_data.username,
                name: response.data.data[j].user_data.name,
                image: response.data.data[j].user_data.image,
                public: response.data.data[j].user_data.public,
              };
              $scope.lista.push({
                user: user,
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

          var user = {
            id: response.data.data[i].id,
            username: response.data.data[i].user_data.username,
            name: response.data.data[i].user_data.name,
            image: response.data.data[i].user_data.image,
            public: response.data.data[i].user_data.public,
          };
          $scope.lista.push({
            user: user,
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
    $http.post(BASE_URL + '/users/'+ $stateParams.id +'/relationship',$json_post).then(function(response){
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

    var options = new FileUploadOptions();
    options.fileKey = "file";
    options.fileName = $scope.image.substr($scope.image.lastIndexOf('/') + 1);
    options.mimeType = "image/jpeg";
    options.chunkedMode = false;

    var params = {};
    params.api_key = "479641643612759";
    params.timestamp = Math.floor(Date.now() / 1000);
    params.upload_preset = 'eix6ihmq';

    options.params = params;

    var ft = new FileTransfer();
    ft.upload($scope.image, encodeURI("https://api.cloudinary.com/v1_1/tfg-lgbt-cloud/image/upload/"), 
      function(r){
        var obj = JSON.parse(r.response);
        console.log(obj);
        var imageURL = obj.url;
      
        $json_post = {
          user_username: $scope.datos.username,
          user_name: $scope.datos.name,
          user_bio: $scope.datos.bio,
          user_email: $scope.datos.email,
          user_gender: $scope.datos.gender,
          user_place: $scope.datos.place,
          user_image: imageURL
        };

        $http.post(BASE_URL+'/users/'+ localStorage.getItem("user_id"), $json_post).then(function(response){
          $ionicLoading.show({template: 'Guardando datos...'});
          console.log(response.data);
          if(!response.data.success){
            window.plugins.toast.showLongBottom(response.data.error.message, function(a){
            console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
          }else{
            $ionicLoading.hide();
            $ionicHistory.goBack();
          }


        },function(error){  
          console.log(error);
        });
      }, $scope.fail, options,true);
    
  };

  $scope.win = function (r) {
    $ionicLoading.hide();
    console.log("Code = " + r.responseCode);
    console.log(r.response);
    alert("Response = " + r.response);
    console.log("Sent = " + r.bytesSent);
  };

  $scope.fail = function (error) {
      alert("An error has occurred: Code = " + error.code);
      window.plugins.toast.showLongBottom('Ha habido un error, prueba de nuevo.', function(a){
            console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
  };

  $scope.onSuccess = function(imageURI) {
    var image = document.getElementById('user_image');
    image.src= imageURI;
    $scope.image = imageURI;
    /*$ionicLoading.show({template: 'Guardando la imagen...'});
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
    ft.upload(imageURI, encodeURI("https://api.cloudinary.com/v1_1/tfg-lgbt-cloud/image/upload/"), $scope.win, $scope.fail, options,true);*/
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

.controller('buscarCtrl', function($scope,$http,$state){
  $scope.busqueda = {};

  $scope.buscar = function() {
    console.log($scope.busqueda.texto);
    //Buscar usuario, post, canal, evento
    
    $http.get(BASE_URL+'/search/users?text='+$scope.busqueda.texto).then(function(resultado){
      console.log(resultado.data);
      $scope.lista = resultado.data.data;
    }, function(error){
      console.log(error);
    });

    $http.get(BASE_URL+'/search/channels?text='+$scope.busqueda.texto).then(function(resultado){
      console.log(resultado.data);
      $scope.channels = resultado.data.data;
    }, function(error){
      console.log(error);
    });

    $http.get(BASE_URL+'/search/events?text='+$scope.busqueda.texto).then(function(resultado){
      console.log(resultado.data);
      $scope.eventos = resultado.data.data;
    }, function(error){
      console.log(error);
    });
  };
})

.controller('reportCtrl', function($scope, $http, $ionicHistory, $stateParams){
  $scope.num = 0;
  $scope.enviar = function() {
    var r;
    switch($scope.num) {
      case 0: window.plugins.toast.showLongBottom('Selecciona una opción', function(a){
            console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)}); return;
      case 1: r = "Está siendo ofensivo o perjudicial"; break;
      case 2: r = "Está participando en algún tipo de acoso"; break;
      case 3: r = "No es adecuado"; break;
      case 4: r = "Es spam"; break;
    }

    var type;
    if($stateParams.tipo = "usuario") type = 1;
    else if($stateParams.tipo = "comentario") type = 2;
    else if($stateParams.tipo = "canal") type = 3;

    $json_post = {
      target_id: $stateParams.id,
      target_type: type,
      reason: r
    };
    $http.post(BASE_URL+'/report', $json_post).then(function(response){
      if(!response.data.success){
        window.plugins.toast.showLongBottom(response.data.error.message, function(a){
            console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
      }else{
        window.plugins.toast.showLongBottom('Reporte enviado correctamente', function(a){
            console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
        $ionicHistory.goBack();
      }
    }, function(error){
      console.log(error);
    });
  };

  $scope.marcar = function(n) {
    if($scope.num == n)
      $scope.num = 0;
    else $scope.num = n;
  };

  $scope.irAtras = function() {
    $ionicHistory.goBack();
  };
})

.controller('configCtrl', function($scope, $stateParams,$state,$ionicHistory, md5, $http) {

  $scope.fontSize = function() {

  };

  $scope.user = {};
  $scope.cambiarContrasena = function() {

    if($scope.user.newpswd == $scope.user.newpswd2) {
      var oldpswd = md5.createHash($scope.user.oldpswd || '');
      var newpswd = md5.createHash($scope.user.newpswd || '');

      $json_post = {
        user_oldpswd: oldpswd,
        user_newpswd: newpswd 
      };
      $http.post(BASE_URL+'/password',$json_post).then(function(response){
        if(!response.data.success)
          window.plugins.toast.showLongBottom(response.data.error.message, function(a){
            console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
        window.plugins.toast.showLongBottom('Se ha cambiado la contraseña correctamente', function(a){
          console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
      }, function(error){
        console.log(error);
      });
    }else{
      window.plugins.toast.showLongBottom('Las contraseñas no coinciden', function(a){
        console.log('toast success: ' + a)}, function(b){alert('toast error: ' + b)});
    }
    
  };

  if(localStorage.getItem("user_public")=="false")
    $scope.privado = true;
  else $scope.privado = false;
  
  $scope.perfilPrivado = function(){

    $http.post(BASE_URL+'/privacity').then(function(response){
      console.log(response.data);
      localStorage.setItem("user_public", response.data.data);
    }, function(error){
      console.log(error);
    });
  };

  $scope.cerrarSesion = function() {
    localStorage.clear();
    $ionicHistory.clearCache();
    $state.go('login');
  };

  //Solicitud de convertirse en editor
  $scope.enviarSolicitud = function() {
    /*$json_post = {

    };

    $http.post(BASE_URL+'/editor', $json_post).then(function(response) {

    }, function(error) {

    });*/
    $state.go('tab.inicio');
  };
});