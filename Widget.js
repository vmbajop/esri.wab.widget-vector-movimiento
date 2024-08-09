define([
  "dojo/_base/declare",
  "jimu/BaseWidget",
  "dojo/_base/lang",
  "dojo/dom",
  "dojo/dom-style",
  "dojo/dom-construct",
  "dojo/text!./manifest.json",
  "dojo/json",
  "esri/InfoTemplate",
  "esri/graphic",
  "esri/geometry/Polyline",
  "esri/geometry/geodesicUtils",
  "esri/geometry/geometryEngine",
  "esri/layers/GraphicsLayer",
  "./CreadorControles-v03",
  "dijit/Tooltip",
  "esri/symbols/SimpleLineSymbol",
  "./libreriasExternas/dls/DirectionalLineSymbol",
  "esri/symbols/PictureMarkerSymbol",
  "esri/symbols/TextSymbol",
  "esri/symbols/Font",
  "./libreriasExternas/milsymbol_AMD",
  "esri/Color",
  "esri/tasks/query", 
  "esri/tasks/QueryTask",
  "esri/graphicsUtils",
  "esri/geometry/webMercatorUtils",
  "dijit/ConfirmDialog",
  "dojo/_base/html",
  "dijit/Menu",
  "dijit/MenuItem",
  "dijit/PopupMenuItem",
  "dijit/MenuSeparator",
  "dijit/Dialog",
  "dijit/form/NumberSpinner",
  "jimu/PanelManager",
  "esri/dijit/util/busyIndicator",
  "./Auxiliar/Auxiliar-v02",
  "jimu/LayerStructure",
  "dojo/domReady!"
  ],
  function(
    declare, BaseWidget, lang,
    dom, domStyle, domConstruct,
    manifest,
    JSON,
    InfoTemplate,
    Graphic, Polyline, geodesicUtils, geometryEngine, GraphicsLayer,
    CreadorControles,
    Tooltip,
    SimpleLineSymbol, DirectionalLineSymbol, PictureMarkerSymbol, TextSymbol, Font,
    ms,
    Color, 
    Query, QueryTask,
    GraphicsUtils, webMercatorUtils,
    ConfirmDialog,
    html,
    Menu, Menuitem, PopupMenuItem, MenuSeparator,
    Dialog, NumberSpinner,
    PanelManager,
    busyIndicator,
    ClaseAuxiliar,
    LayerStructure
    ) {
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      baseClass: 'jimu-widget-vectorMovimiento',

      //Info del widget.
      _nombre: "",
      _version:"",
      _autor:"",
      _copyright:"",
      _WABbase: "",
      
      //Nodos preconstruidos en HTML
      _nodoSelectorCapa: null,
      _nodoListadoCapas: null,

      //Identificadores de Controles a generar
      _idSelectorCapa: null,

      //opciones      
      _capaSeleccionada: null,                  //la capa de la que se extraen los puntos para generar las líneas vectores      
      _capaSeleccionadaLayerInfo: null,         //El layerInfo de la capa seleccionada 
      
      //variables
      _valorColorAPP6B: null,                   //Valor app6B de la entidad con varios registros que va a ser la base para el color de la línea vector 
      _contadorCapasGeneradas: 1,               //contador de capas de líneas vectores generadas
      _nombreOrganizacion: "",                  //nombre registrado para la organización en seguimiento

      //Opciones de configuración
      _idCapaVectores: null,                 //Identificador inicial de las capas de vectores que se generen
      _idCapaTextos: null,                   //Identificador inicial de las capas de texto que se generen
      _tamanioFuenteIncial: null,            //Tamaño de la fuente de las etiquetas que se crean en la capa ¡¡NO las del símbolo APP6!!
      _escalaMinimaVerEtiquetas: null,       //Factor de escala a partir del que se empiezan a ver las etiquetas      
      _colorTexto: null,
      _anchoLinea: null,                     //Ancho de la línea vector a generar      
      _campoWhere: null,                     //campo para identificador de todos los reistros de una misma organizacion (entidad puntual)
      _campoNombre: null,                    //campo para establecer el nombre de la organización en seguimiento en cada capa
      _campoFecha: null,                     //fecha para ordenar el resultado de la consulta.
      _campoFechaAPP6: null,                 //Campo con la fecha en formato APP6.
      _campoAPP6: null,                      //campo donde está el código APP6B      
      _campoDesignacionUnica: null,          //campo para la designación única del conjunto histórico de puntos      
      _campoCodPais: null,
      _tipoLinea: SimpleLineSymbol.STYLE_SHORTDASH, //Tipo de línea inicial para generar los vectores con SimpleLineSymbol  

      //Opciones relacionadas con la comuniación con otros widgets
      //----- Widget vectores de movimiento
      _nombreWidgetCargaConfiguracionesMapa: "GuardarMapa", //Nombre del widget con el que se comunica según las siguientes opciones
      mData: "",                                            //Datos que envía el widget anterior
      mExtensionURL: "",                                     //el número de la capa del servicio para terminar de construir la url de la queryTask            
      mIterador: -1,                                        //contador de iteraciones para controlar el flujo entre el QueryTask y el for de capas de los datos enviados --> pendiente de control por promise o deferred
      mContador: -1,                                        //máximo número de iteraciones
      mVieneDeonReceiveData: false,                         //Control o bandera de que la llamada a generar capa viene de un paso de datos desde el widget de arriba
      mIDsCumplenQueryGuardada: null,                       //Se aplica la query guardada en la capa de historico, se obtienen los que cumplen y con ellos se recorren los guardados, para recuperar su simbolo. Los que cumplen que no tengan imbolo, se les aplica el por defecto.
      mIDsGuardadosEnJson: null,                            //IDs de entidades en distintas posiciones guardados en graphicslayer
      mSLSymbol: null,                                      //simple line symbol que viene de los datos pasados por ek widget de arriba
      mTxtSymbol: null,                                     //Text symbol que viene de los datos pasados por ek widget de arriba

      aux: null,  //para controlar la instancia de la clase Auxiliar

      startup: function() {
        //dojo.addClass(document.body,"claro");
        this.inherited(arguments);

        this.busyIndicator = busyIndicator.create({
          target: this.domNode.parentNode.parentNode.parentNode,
          backgroundOpacity: 0
        });

        //Configuracion opciones
        this._idCapaVectores = this.config.IdentificadorCapa.vectores;
        this._idCapaTextos = this.config.IdentificadorCapa.textos;

        this._tamanioFuenteIncial = this.config.PropiedadesGraficas.Fuente.tamanioInicialFuente;
        this._escalaMinimaVerEtiquetas = this.config.PropiedadesGraficas.Fuente.escalaMinimaMostrarEtiqueta;
        this._colorTexto = this.config.PropiedadesGraficas.Fuente.colorInicialTexto;

        this._anchoLinea = this.config.PropiedadesGraficas.Lineas.anchoLinea;

        this._campoWhere = this.config.CamposCapaPosicionesHistoricas.campoIdentificadorUnicoEntidadEnMovimiento;
        this._campoNombre = this.config.CamposCapaPosicionesHistoricas.campoNombreEntidadEnMovimiento;
        this._campoFecha = this.config.CamposCapaPosicionesHistoricas.campoFechaInicioPosicion;
        this._campoFechaAPP6 = this.config.CamposCapaPosicionesHistoricas.campoFechaInicioPosicion;
        this._campoAPP6 = this.config.CamposCapaPosicionesHistoricas.campoCodigoAPP6;
        this._campoDesignacionUnica = this.config.CamposCapaPosicionesHistoricas.campoNumeralDesignadorUnico;
        this._campoCodPais = this.config.CamposCapaPosicionesHistoricas.campoNombreCortoPais;
        
        //Nodos preconstruidos en HTML
        this._nodoSelectorCapa = "nodoInsercionSelectorCapaMoVector";
        this._nodoListadoCapas = "panelCapasGraficasVectores";

        //html id de los controles a generar
        this._idSelectorCapa = "idSelectorCapaMoVector";

        //identificador del widget
        this._nombre = JSON.parse(manifest).name; 
        this._version = JSON.parse(manifest).version;
        this._autor = JSON.parse(manifest).author;
        this._copyright = JSON.parse(manifest).copyright;
        this._WABbase = JSON.parse(manifest).wabVersion;

        this.aux = new ClaseAuxiliar({
          origen: this
        });

        this._crearControles();
        
        dom.byId("versionMoVector").innerHTML = this._version;

        html.addClass(this.jimuButtonExe, "jimu-state-disabled");
        
        console.log("-startup- Iniciado el Widget " + this._nombre + " version " + this._version);
        console.info("por " + this._autor + " (c)"+ this._copyright);
        console.info("Query.geometry establecido a la extensión completa de la capa con las posiciones históricas.");

        //comunicación con el widget de carga de mapas (GuardarMapas)        
        this.fetchDataByName(this._nombreWidgetCargaConfiguracionesMapa);
      },
      
      /**
       * Método para gestionar las comunicaciones entre widgets. Recibe información desde otro widget
       * @param {String} name Nombre del widget que envía la comunicación
       * @param {String} widgetId ID del widget que envía la comunicaciójn
       * @param {*} data Datos que envía el widget
       * @param {*} historyData Si envía datos a ser almacenados en un histórico, vienen en esta variable
       */
      onReceiveData: function(name, widgetId, data, historyData){
        this.mData = data;
        this.mIterador = 0;
        this.mVieneDeonReceiveData = true;
        
        var idCapaOrigen = this.mData.datosCapasVectores[0].idCapaOrigen;
        var idCapa = idCapaOrigen;
        
        if(idCapaOrigen.lastIndexOf("_") > -1){
          idCapa = idCapaOrigen.substring(0, idCapaOrigen.lastIndexOf("_"));
          this.mExtensionURL = idCapaOrigen.substring(idCapaOrigen.lastIndexOf("_")+1, idCapaOrigen.length);
        }
        
        var lyrStructureInstance = LayerStructure.getInstance();
        lyrStructureInstance.traversal(lang.hitch(this, function(layerNode){
          if(layerNode.id == idCapaOrigen){
            this._capaSeleccionadaLayerInfo = lyrStructureInstance.getNodeById(idCapaOrigen);
          }
        }));

        this._capaSeleccionada = this.map.getLayer(idCapa);

        var queryRecuperada = new Query();
        queryRecuperada.returnGeometry = true;
        queryRecuperada.geometry = this._capaSeleccionada.fullExtent;
        queryRecuperada.outFields = [this._campoWhere, this._campoNombre];
        queryRecuperada.where = this._capaSeleccionada.layerDefinitions[this.mExtensionURL];
        queryRecuperada.orderByFields = [this._campoNombre];

        var resultadoDinamicoQueryGuardada = new QueryTask(this._capaSeleccionada.url + "/" + this.mExtensionURL);
        resultadoDinamicoQueryGuardada.execute(queryRecuperada, lang.hitch(this, function(cumplenQueryGuardada){
          this.mIDsCumplenQueryGuardada = [];
          dojo.forEach(cumplenQueryGuardada.features, lang.hitch(this, function(feature){
            var valorUnico = feature.attributes[this._campoWhere];
            if(valorUnico && this.mIDsCumplenQueryGuardada.indexOf(valorUnico) == -1){
              this.mIDsCumplenQueryGuardada.push(valorUnico)
            }
          }));

          this.mContador = this.mIDsCumplenQueryGuardada.length; //data.datosCapasVectores.length;

          this.mIDsGuardadosEnJson = []; //valores únicos de los IDs guardados en el Json de las capas de vectores
          for(var i=0; i<this.mData.datosCapasVectores.length; i++){
            this.mIDsGuardadosEnJson.push(this.mData.datosCapasVectores[i].valorWhere);
          }
          html.removeClass(this.jimuButtonExe, "jimu-state-disabled"); //Se desbloquea el botón para que se despliegue el panel
          this._setFormatoPanel();
          this._onReceiveDataIterator();
        }));
      },

      /**
       * Auxiliar del anterior. Gestiona la sincronicidad de la función _generarCapasGraficas, dado que usa QueryTask.execute, que es asíncrona.
       * Utiliza mIterator que es el conteo de paso por los valores (i en un for); mContador que es el número de elementos sobre los que pasar ([].length en un for).
       * Lo que hace es pasar los valores únicos a _generarCapasGraficas, trabajando igual que cuando se pulsa el botón, que lanza la operación a través de obtenerValoresUnicos
       */
      _onReceiveDataIterator:function(){
        if(this.mIterador < this.mContador){
          this.mSLSymbol = null;
          this._colorTexto = this.config.PropiedadesGraficas.Fuente.colorInicialTexto;          
          this.mTxtSymbol = null;

          var idATratar = this.mIDsCumplenQueryGuardada[this.mIterador];
          
          var indexOfVectores = -1;

          if(this.mIDsGuardadosEnJson.indexOf(idATratar) > -1){
            indexOfVectores = this.mIDsGuardadosEnJson.indexOf(idATratar)
             //Si es esriSLS es línea (de momento no se ha puesto otro tipo de linea). Si viene esriPMS (simpleMarkerSymbol) es app6, no tiene datos de simbolo adecuados, porque es milsymbol
            if(this.mData.datosCapasVectores[indexOfVectores].simboloJson.type == "esriSLS"){
              this.mSLSymbol = new SimpleLineSymbol(this.mData.datosCapasVectores[indexOfVectores].simboloJson);
            }            
          }

          if(indexOfVectores > -1){
            //puede venir sin datos, porque se corresponda a una capa sin texto (sólo app6)
            if(this.mData.datosCapasTexto[indexOfVectores].simboloJson){
              this.mTxtSymbol = new TextSymbol(this.mData.datosCapasTexto[indexOfVectores].simboloJson);
              this._colorTexto = this.mData.datosCapasTexto[indexOfVectores].simboloJson.color;
            }            
          }
          this._logControlEquivalencias(idATratar, indexOfVectores);
          this._generarCapasGraficas(idATratar, this.mExtensionURL);
        }
        else{
          this._colorTexto = [0, 0, 0];
          this.mSLSymbol = null;
          this.mTxtSymbol = null;

          this._capaSeleccionada = null;

          this.mIterador = -1;
          this.mContador = -1;
          this.mVieneDeonReceiveData = false;
          this.mData = "";

          this.mExtensionURL = "";
          this.mIDsCumplenQueryGuardada = null;
          this.mIDsGuardadosEnJson = null;

          PanelManager.getInstance().closePanel(this.id + "_panel");
          
          var widgets = this.appConfig.getConfigElementsByName(this._nombreWidgetCargaConfiguracionesMapa);
          if(widgets.length > 0){
            var widgetId = widgets[0].id;
            PanelManager.getInstance().closePanel(widgetId + "_panel");       
          }
        }
      },

      /**
       * Sólo genera un mensaje que permite comprobar que los pares capaVectores/capatextos tienen nombres correspondientes (por el número) y que el valorWhere almacenado se corresponde con idATratar iterado
       * @param {String*} idATratar 
       */
      _logControlEquivalencias: function(idATratar, indexOfVectores){
        console.log("*************************************************************\n");
        console.info("iteración: " + this.mIterador + "\n"
          + "identificador de organización " + idATratar + "\n"
          + "Existe en el json " + this.mIDsGuardadosEnJson.indexOf(idATratar) > -1 + "\n");

        if(indexOfVectores > -1){
          console.info("Capa Vectores: " + this.mData.datosCapasVectores[indexOfVectores].id + " -- " + this.mData.datosCapasVectores[indexOfVectores].nombre + "\n"
          + "Capa Fechas  : " + this.mData.datosCapasTexto[indexOfVectores].id + "\n" 
          + "Control--> identificador de organización " + idATratar + " valorWhere de trabajo " + this.mData.datosCapasVectores[indexOfVectores].valorWhere + "\n");
        }
        console.log("-------------------------------------------------------------");
      },

      onOpen: function(){
        this._setFormatoPanel();
      },

      onClose: function(){         
        console.log("-onClose- Cerrado el Widget " + this._nombre + " version " + this.version);
      },

      _setFormatoPanel: function(){
        var panel = this.getPanel();

        if(this.jimuButtonExe.className.indexOf("jimu-state-disabled") == -1){
          panel.resize({
            h:this.map.height * 0.85
          });
        }else{
          //panel.position.height = 380;
          panel.resize({
            h:380
          });
        }
        
        panel.position.width = 400;
        panel.position.top = 20;

        panel.setPosition(panel.position);
        panel.panelManager.normalizePanel(panel);
      },

      _crearControles: function(){
        var creaControl = new CreadorControles();

        //Select o combo de seleccion de capas
        var selectLayerChooser = creaControl.controlLayerChooser(this.map,
          this._idSelectorCapa,
          this._nodoSelectorCapa,
          ['point']);

        selectLayerChooser.on("selection-change", lang.hitch(this, function(e){
          if(selectLayerChooser.getSelectedItem()){
            this._capaSeleccionadaLayerInfo = selectLayerChooser.getSelectedItem().layerInfo;
            html.removeClass(this.jimuButtonExe, "jimu-state-disabled");
          }
        }));
      },
     
      obtenerValoresUnicos: function(){        
        try{          
          var contadorCapas = 0;          
          var padre = this;
          var campoW = this._campoWhere;
          var campoN = this._campoNombre;
          var valoresUnicos = [];
                  
          var qValoresUnicos = new Query();        
          qValoresUnicos.returnGeometry = false;
          //qValoresUnicos.geometry = this._capaSeleccionadaLayerInfo.layerObject.fullExtent; Linea editada por no funcionar en caso de quewraparound180 funcione, y no es necesario
          qValoresUnicos.outFields = [campoW, campoN];
          qValoresUnicos.orderByFields = [campoN]; //No funciona

          var layerInfoAncestral = this.aux.getLayerInfoAncestral(this._capaSeleccionadaLayerInfo);
          this._capaSeleccionada = this.map.getLayer(layerInfoAncestral.id)

          if(this._capaSeleccionadaLayerInfo.parentLayerInfo == null){
            if(this._capaSeleccionadaLayerInfo.layerObject.getDefinitionExpression()){
              qValoresUnicos.where = this._capaSeleccionadaLayerInfo.layerObject.getDefinitionExpression();
            }
          }else{
            if(layerInfoAncestral.layerObject.layerDefinitions && layerInfoAncestral.layerObject.layerDefinitions[this._capaSeleccionadaLayerInfo.subId]){
              qValoresUnicos.where = layerInfoAncestral.layerObject.layerDefinitions[this._capaSeleccionadaLayerInfo.subId];
            }
          }

          var padre = this;
          this._capaSeleccionadaLayerInfo.layerObject.queryFeatures(qValoresUnicos, function(results){
            dojo.forEach(results.features, function(result){
              var valorUnico = result.attributes[campoW];
              if(valorUnico !== null && valoresUnicos.indexOf(valorUnico) == -1){
                valoresUnicos.push(valorUnico);
                padre._generarCapasGraficas(valorUnico, padre._capaSeleccionadaLayerInfo.subId);

                //Desplegar panel
                contadorCapas++;
                if(contadorCapas == 5){
                  padre._setFormatoPanel();                  
                }
              }
            })
          }, function(err){
            console.error("Error en la consulta a la capa " + this._capaSeleccionadaLayerInfo.layerObject.name + ".queryFeatures(query, function(){...}).\n" + err);
            padre.busyIndicator.hide();
            return;
          });          
       }catch(err){
         console.error("Error en la generación obtención de valores únicos  obtenervaloresUnicos().\n" + err);
         this.busyIndicator.hide();
         return;
       }
      },
      
      _generarCapasGraficas: function(valorUnico, extensionURL){
        var capa = this._capaSeleccionada;
        var padre = this;
        var url;

        if(capa !== null && this._campoWhere !== null && valorUnico !== null){
          var consulta = "";
          var query = new Query();
        
          if(this._capaSeleccionada.declaredClass == "esri.layers.ArcGISDynamicMapServiceLayer"){
            url = this._capaSeleccionada.url + "/" + extensionURL;
            if(this._capaSeleccionada.layerDefinitions[this._capaSeleccionadaLayerInfo.subId]){
              consulta = "(" + this._capaSeleccionada.layerDefinitions[this._capaSeleccionadaLayerInfo.subId] + ") AND "; 
            }                       
          }else if(this._capaSeleccionada.declaredClass == "esri.layers.FeatureLayer"){
            url = this._capaSeleccionada.url;
            if(this._capaSeleccionada.getDefinitionExpression()){
              consulta = "(" + this._capaSeleccionada.getDefinitionExpression() + ") AND ";
            }            
          }else{
            console.error( "La capa es de tipo " + this._capaSeleccionada.declaredClass +"\n" + 
            "La capa debe ser de tipo esri.layers.ArcGISDynamicMapServiceLayer \n" +
            "o de tipo esri.layers.FeatureLayer");
            this.busyIndicator.hide();
            return;
          }

          query.where = consulta + this._campoWhere + " = '" + valorUnico + "'";
          query.returnGeometry = true;
          //query.geometry = this._capaSeleccionada.fullExtent; Linea editada por no funcionar en caso de quewraparound180 funcione, y no es necesario
          query.outFields = ["*"];
          query.orderByFields = [this._campoFecha]; //Ordenar por el campo de la fecha

          var queryTask = new QueryTask(url);

          queryTask.execute(query, function(results){
            var colorTextoAPP6 = "rgb(" + padre._colorTexto[0] + ", " + padre._colorTexto[1] + ", " + padre._colorTexto[2] + ")";
            var ultimaEntidad = null; //última situación de la organización para situar su simbolo APP6B 
            var cantidad = results.features.length;

            var vectoresGraphicsLayer = new GraphicsLayer();
            vectoresGraphicsLayer.id = padre._idCapaVectores + padre._contadorCapasGeneradas; // ----------------> OJO, este valor es esencial para el widget de guardado de mapa, porque identifica estas capas por este nombre
                       
            vectoresGraphicsLayer.infoTemplate = padre._obtenerInfoTemplate();
            
            vectoresGraphicsLayer.on("click", function(evt){
              if(evt.graphic.symbol.declaredClass == "esri.symbol.PictureMarkerSymbol"){
                //evt.stopImmediatePropagation();
                var infoTemplatePMS = new InfoTemplate({
                  title: padre.nls.infoTemplTitulo + " <b>${" + padre._campoDesignacionUnica + "}<b>",
                  content: "${*}"
                });
                evt.graphic.setInfoTemplate(infoTemplatePMS);
              }
            });

            var grafico;

            if(cantidad == 1){
              vectoresGraphicsLayer.title = padre.nls.nombreCapaGeneradaSoloUna + results.features[0].attributes[padre._campoNombre] + " (" + cantidad + ")";
              grafico = padre._obtenerAPP6Graphic(results.features[0], colorTextoAPP6);
              //grafico.setAttributes(padre._generarAtributosVector(results.features[0], results.features[0]));
              vectoresGraphicsLayer.add(grafico);
              padre.map.addLayer(vectoresGraphicsLayer);
            }

            if(cantidad > 1){
              var textosGraphicsLayer = new GraphicsLayer(); //Se crea para a parte para controlar la escala de visualización de los textos, pero podría ir en la misma capa
              textosGraphicsLayer.id = padre._idCapaTextos + padre._contadorCapasGeneradas; // ----------------> OJO, este valor es esencial para el widget de guardado de mapa, porque identifica estas capas por este nombre
              for(var i = 0; i < results.features.length - 1; i++){
                //Se lee el valor del campo app6 para asignar color a la línea
                if(padre._valorColorAPP6B == null){
                  if(results.features[i].attributes[padre._campoAPP6] !== "" && results.features[i].attributes[padre._campoAPP6] !== "undefined" && results.features[i].attributes[padre._campoAPP6] !== null){
                    padre._valorColorAPP6B = results.features[i].attributes[padre._campoAPP6];
                  }
                }
                //Se lee el valor del campo nombre para asignar nombre a la capa
                if(padre._nombreOrganizacion == "" || padre._nombreOrganizacion === "undefined" || padre._nombreOrganizacion === null){ //Si aun no ha sido asignado
                  padre._nombreOrganizacion = results.features[i].attributes[padre._campoNombre];
                  vectoresGraphicsLayer.title = padre.nls.nombreCapaGenerada + padre._nombreOrganizacion + " (" + cantidad + ")"; //propiedad que no existe, es forzada
                }
  
                var puntoFrom = results.features[i];
                var puntoTo = results.features[i+1];
                
                var geomPolyLine = new Polyline(padre.map.spatialReference);
                geomPolyLine.addPath([[puntoFrom.geometry.x, puntoFrom.geometry.y],[puntoTo.geometry.x, puntoTo.geometry.y]]);
                
                //Con este método se convierte en geodésica (curva), que es la que debe funcionar cuando se arregle lo del wrapAround180
                var geodesicLine = geodesicUtils.geodesicDensify(geomPolyLine, 100000);
                //Si se añade directamente la geomPolyLine en vez de geodesicLine, se añade una línea no geodésica (no curva)
                var graficoVector = new Graphic(geodesicLine, padre._generarSimpleLineSymbol(), padre._generarAtributosVector(puntoFrom, puntoTo), null);
  
                vectoresGraphicsLayer.add(graficoVector);
  
                if(i == results.features.length - 2){
                  ultimaEntidad = results.features[i+1];
                  if(ultimaEntidad.attributes[padre._campoAPP6] !== "" && ultimaEntidad.attributes[padre._campoAPP6] !== null && ultimaEntidad.attributes[padre._campoAPP6] !== 'undefined'){
                    grafico = padre._obtenerAPP6Graphic(ultimaEntidad, colorTextoAPP6);
                    //grafico.setAttributes(padre._generarAtributosVector(ultimaEntidad, ultimaEntidad));
                    vectoresGraphicsLayer.add(grafico);
                  }
                }
                
                if(i<results.features.length-1){
                  console.log("hay " + results.features.length + " features >>> generando leyenda de la feature " + i);
                  textosGraphicsLayer.add(padre._obtenerEtiquetasGraficasFecha(results.features[i].attributes[padre._campoFechaAPP6], results.features[i].geometry, padre._tamanioFuenteIncial));
                }
              }
              padre.map.addLayer(vectoresGraphicsLayer);

              textosGraphicsLayer.setMinScale(padre._escalaMinimaVerEtiquetas);
              padre.map.addLayer(textosGraphicsLayer);
            }

            padre._generarLineaEnListaDeCapas(vectoresGraphicsLayer, textosGraphicsLayer);

            padre._valorColorAPP6B = null; //reinicio del valor APP6 para determinar color de línea
            padre._nombreOrganizacion = ""; //reinicio del nombre de la capa

            if(padre.mVieneDeonReceiveData){
              padre.mIterador++;
              padre._onReceiveDataIterator();
            }

          }, function(err){
            console.error("Error en leerValoresCampos. \n Valores del error = " + err.toString());
          });
        }
      },

      /**
       * Crea los atributos para cada entidad lineal que se genera como gráficos en la capara correspondiente.
       * @param {Graphic} graficoFrom Gráfico de tipo punto de inicio de un vector
       * @param {Graphic} graficoTo Gráfico de tipo punto de final de un vector
       * @returns {Object}  Listado de pares Atributo:valor
       */
      _generarAtributosVector: function(graficoFrom, graficoTo){
        var opcionesFecha = {
          day:"2-digit",
          month:"2-digit",
          year:"numeric",
          hour:"2-digit",
          minute:"2-digit",
          second:"2-digit"
        };

        var distancia = geometryEngine.distance(webMercatorUtils.geographicToWebMercator(graficoFrom.geometry), webMercatorUtils.geographicToWebMercator(graficoTo.geometry), "kilometers");
        var t = (graficoTo.attributes[this._campoFecha] - graficoFrom.attributes[this._campoFecha]) / 3.6E+6; //da ms que /1000 --> sg que /60 --> min que /60 --> h >operacion> ms/3.6x10^6

        var kmh;
        var nud;

        if(!isNaN(distancia) &&  !isNaN(t) && t > 0){
          kmh = (distancia / t).toFixed(1);
          nud = ((distancia / t)/1.852).toFixed(1);
        }else{
          var mensaje = graficoFrom.attributes[this._campoNombre] 
            + " NO puede almacenar la VELOCIDAD  desde la posición en fecha " + new Date(graficoFrom.attributes[this._campoFechaAPP6]).toLocaleDateString('es-ES', opcionesFecha) 
            + " porque  -> \n";
          if(isNaN(distancia)){
            mensaje += "Tipo 1.- La distancia no es numérica.\n";
          }
          if(isNaN(t)){
            mensaje += "Tipo 2.- El tiempo no es un número.\n";
          }
          if(t==0){
            mensaje += "Tipo 3.- El tiempo transcurrido es 0.\n";
          }
          if(t<0){
            mensaje += "Tipo 4.- El tiempo transcurrido es negativo";
          }
          console.warn(mensaje);
        }        
        
        var atributos ={};
        atributos["Organizacion"] = graficoFrom.attributes[this._campoNombre];
        atributos["Numeral"] = graficoFrom.attributes[this._campoDesignacionUnica];
        atributos["ID_capaOIIs"] = this._capaSeleccionadaLayerInfo.id;      //id de la capa en Server
        atributos["ValorWhere"] = graficoFrom.attributes[this._campoWhere]; //valor único de la entidad que genera el gráfico a lo largo del tiempo
        atributos["FechaFrom"] = new Date(graficoFrom.attributes[this._campoFecha]).toLocaleDateString('es-ES', opcionesFecha);
        atributos["FechaTo"] = new Date(graficoTo.attributes[this._campoFecha]).toLocaleDateString('es-ES', opcionesFecha);
        atributos["Tiempo"] = this.aux.milisegAdescripcion(t*3.6E+6);
        atributos["Distancia"] = distancia.toFixed(1);
        atributos["vTeorica_kmh"] = kmh;
        atributos["vTeorica_nudos"] = nud;

        return atributos;
      },      
      
      /**
       * Construye la plantilla de información a partir de los atributos de la capa de vectores, para poder ser consultada mediante un clic. Ver arriba _generarAtributosVector porque usa los mismos nombres
       * @returns {Infotemplate} Plantilla de representación de la información
       */
      _obtenerInfoTemplate: function(){
        var contenido = "<div style='line-height:1.6;'><b>" + this.nls.infoTemplOrg + "</b>: ${Organizacion}"
          + "<br><b>" + this.nls.infoTemplFechaIni + "</b>: ${FechaFrom}"
          + "<br><b>" + this.nls.InfoTemplFechaFin + "</b>: ${FechaTo}"
          + "<br><b>" + this.nls.InfoTemplTiempo + "</b>: ${Tiempo}"
          + "<br><b>" + this.nls.InfoTemplDistancia + "</b>: ${Distancia} km"
          + "<br><b>" + this.nls.InfoTemplVelocidad + "</b>: ${vTeorica_kmh} km/h"
          + "<br><b>" + this.nls.InfoTemplVelocidad + "</b>: ${vTeorica_nudos} " + this.nls.InfoTemplnudos + "</div>"
        
        return new InfoTemplate(this.nls.infoTemplTitulo + " <b>${Numeral}<b>", contenido);
      },

      /**
       * Genera la geometría de las líneas entre dos localizaciones conocidas de una organización
       * @returns {SimpleLineSymbol}
       */
      _generarSimpleLineSymbol: function(){
        if(this.mSLSymbol){
          return this.mSLSymbol;
        }
        else{
          var color = new Color(this._obtenerRGB());        
          var simpleLineSymbol = new SimpleLineSymbol(
            this._tipoLinea, //SimpleLineSymbol.STYLE_SOLID,
            color,
            this._anchoLinea
          );
          simpleLineSymbol.setMarker({
            style:"arrow",
            placement: "end"
          });
          return simpleLineSymbol;
        }        
      },

      /**
       * Genera la geometría de las líneas entre dos localizaciones conocidas de una organización
       * @returns {DirectionalLineSymbol} Clase en librería externa que genera líneas animables
       */
      _generarDirectionalLineSymbol: function(){
        var anchoLinea = this._anchoLinea;
        var dls = new DirectionalLineSymbol({
          style: SimpleLineSymbol.STYLE_SOLID,
          color: new Color(this._obtenerRGB()),
          width: anchoLinea,
          directionSymbol: "arrow2",
          directionSize: 10, //default 12
          //directionColor: color,
          directionPixelBuffer: 50, //distancia entre flechas ex60
          //directionScale: 0.8, //??
          //animationRepeat: 'Infinity',
          //animationDuration: 450,
          //showDirectionalSymbols: true,
        });
        return dls;
      },         

     /**
      * Obtiene el símbolo APP6 de una geometría a partir de libreria externa milsymbol
      * @param {Feature} ultimaEntidad Representa el último punto de una ruta completa de vectores. Esa posición será simbolizada con APP6
      * @param {String} rgbTexto estructura "rgb(r,g,b)" que necesita milsymbol para dar color al texto alrededor del símbolo
      * @returns 
      */
      _obtenerAPP6Graphic: function(ultimaEntidad, rgbTexto){
       if(ultimaEntidad && ultimaEntidad.attributes[this._campoAPP6] !== "" && ultimaEntidad.attributes[this._campoAPP6] !== "undefined"){

         var valorCodAPP6 = ultimaEntidad.attributes[this._campoAPP6];
         var valorFecha = "";
         var valorDesignacionUnica = "";
         var valorCodPais = "";

         if(ultimaEntidad.attributes[this._campoFechaAPP6] !== "" && ultimaEntidad.attributes[this._campoFechaAPP6] != "undefined" && ultimaEntidad.attributes[this._campoFechaAPP6] !== null){
          valorFecha = this.aux.formatearFecha(ultimaEntidad.attributes[this._campoFechaAPP6], this.config.PropiedadesGraficas.APP6.usarFechaLarga);
         }
         if(ultimaEntidad.attributes[this._campoDesignacionUnica] !== "" && ultimaEntidad.attributes[this._campoDesignacionUnica] != "undefined" && ultimaEntidad.attributes[this._campoDesignacionUnica] !== null){
          //valorDesignacionUnica = ultimaEntidad.attributes[this._campoDesignacionUnica];
          //Se quiere que el designador único en este caso sea el nombre de la unidad
          valorDesignacionUnica = ultimaEntidad.attributes[this._campoNombre];
         }
         if(ultimaEntidad.attributes[this._campoCodPais] !== "" && ultimaEntidad.attributes[this._campoCodPais] != "undefined" && ultimaEntidad.attributes[this._campoCodPais] !== null){
          valorCodPais = ultimaEntidad.attributes[this._campoCodPais];
         }

        var size= this.config.PropiedadesGraficas.APP6.tamanioSimbolo; //14
        var infoShow = true;
        var infoSize = this.config.PropiedadesGraficas.APP6.tamanioTextoInformacion; //56; //%
        var colorInfoArround = rgbTexto; //"rgb(0, 0, 0)";
        var anchoLinea = this.config.PropiedadesGraficas.APP6.grosorLíneasDelSimbolo; //4;
        var colorMode = this.config.PropiedadesGraficas.APP6.symbolColorMode;
        var fontFamily = this.config.PropiedadesGraficas.APP6.fontFamily;

        var app6Symbol = new ms.Symbol(valorCodAPP6,{
          size: size,
          uniqueDesignation: valorDesignacionUnica,
          dtg: valorFecha,
          staffComments: valorCodPais,
          fontfamily: fontFamily,
          infoFields: infoShow,
          infoSize: infoSize,
          colorMode: colorMode,
          infoColor: colorInfoArround,
          strokeWidth: anchoLinea,
          square: true
        });

        var pictureMSApp6 = new PictureMarkerSymbol({
          "xoffset": 0,
          "yoffser": 0,
          //"url": app6Symbol.toDataURL(), //Como SVG. Da mejor definición, pero en una capa no se vería en la lista de capas como símbolo de la misma. Problemas con acentosy Ñ
          "url": app6Symbol.asCanvas(5).toDataURL(), //Como PNG. Menor resolución pero aparece en la lista de capas. La resolución mejora subiendo el número del asCanvas(n), pero tarda más.
          "width": Math.floor(app6Symbol.width),   
          "height": Math.floor(app6Symbol.height)
        });

        //Se pasan los atributos de  la última entidad para poderlos pasar desde el grafico cuando es eliminado para cambiar el color
        var graficoAPP6 = new Graphic( ultimaEntidad.geometry, pictureMSApp6, ultimaEntidad.attributes, null);
        //graficoAPP6.geometry = ultimaEntidad.geometry;
        //graficoAPP6.symbol = pictureMSApp6;

        return graficoAPP6;
       }
        
      },

     /**
      * genera las etiquetas para la localización de los puntos de una ruta
      * @param {String} fechaDate Texto a mostrar en la etiqueta
      * @param {Geometry} geometria punto al que se asocia la etiqueta
      * @param {Number} tamanio tamaño del texto
      * @returns {Graphic} Etiqueta
      */
      _obtenerEtiquetasGraficasFecha: function(fechaDate, geometria, tamanio){
        var texto = this.aux.formatearFecha(fechaDate, false);
        var txtSymbol = new TextSymbol(texto);
        if(this.mTxtSymbol){
          txtSymbol.setColor(this.mTxtSymbol.color);
          txtSymbol.font.setSize(this.mTxtSymbol.font.size);
          txtSymbol.font.setFamily(this.mTxtSymbol.font.family); //podría ser = a app6Symbol.style.fontfamily
          txtSymbol.font.setWeight(this.mTxtSymbol.font.weight); //WEIGHT_NORMAL
          txtSymbol.setHorizontalAlignment(this.mTxtSymbol.horizontalAlignment);
          txtSymbol.setOffset(this.mTxtSymbol.xoffset, this.mTxtSymbol.yoffset);
        }
        else{
          var colorOpcionInicial = new Color(this._colorTexto); //new Color(this._obtenerRGB()); opcion. Si se cambia aquí se debe cambiar en _crearMenuContextual
       
          txtSymbol.setColor(colorOpcionInicial);
          txtSymbol.font.setSize(tamanio);      //podría ser = app6Symbol.style.size * app6Symbol.style.infoSize/100
          txtSymbol.font.setFamily("arial"); //podría ser = a app6Symbol.style.fontfamily
          txtSymbol.font.setWeight(Font.WEIGHT_BOLD); //WEIGHT_NORMAL
          txtSymbol.setHorizontalAlignment("right");
          txtSymbol.setOffset(-10, 0);
        }
        var textoGraphic = new Graphic(geometria, txtSymbol);
        return textoGraphic;
     },

     /**
      * Genera una entrada html en el marco del widget con la capa que ha sido generada. Les añade un menú contextual
      * @param {GraphicsLayer} vectoresGraphicsLayer Capa de vectores
      * @param {GraphicsLayer} textosGraphicsLayer Capa de textos
      */ 
     _generarLineaEnListaDeCapas: function(vectoresGraphicsLayer, textosGraphicsLayer){

        this.busyIndicator.show();

        var iddiv = "div_capaListada" + this._contadorCapasGeneradas.toString();
        var checkid = "chk_capaListada" + this._contadorCapasGeneradas.toString();
        var spanid = "span_capaListada" + this._contadorCapasGeneradas.toString();
        var imgUrl = "";
        if(textosGraphicsLayer){
          imgUrl = "images/layer_line.png";
        }else{
          imgUrl = "images/layer_point.png"
        }

        var nodo = "<tr class='spaceUnder'><td colspan='2'><div id='"+ iddiv +
        "'></div><span class='capaPanelTexto' id='" + spanid + 
        "'><img class='imageSelector capaPanel' src='" + this.folderUrl +
        imgUrl + "'/>" + vectoresGraphicsLayer.title +
        "</span></td></tr>"

        domConstruct.place(nodo, this._nodoListadoCapas, "last")

        this._crearMenuContextual(spanid, vectoresGraphicsLayer, textosGraphicsLayer);

        new Tooltip({
          connectId:[spanid],
          showDelay:600,
          position:["before","after","below"],
          label:'<span">' +
                  this.nls.tooltipSobreCapa + '</span>'
        });

        var creaControl = new CreadorControles();
        var checkCapa = creaControl.controlDojoCheck(checkid, iddiv, null, false, true);
        checkCapa.onchange = function(){
          vectoresGraphicsLayer.setVisibility(this.checked);
          if(textosGraphicsLayer){
            textosGraphicsLayer.setVisibility(this.checked);
          }
        }

        //Hacer visible la lista de capas.
        if(dom.byId(this._nodoListadoCapas).style.display !== "block"){
          domStyle.set(dom.byId(this._nodoListadoCapas), "display", "block");
        }

        this._contadorCapasGeneradas++;
        this.busyIndicator.hide();
      },      

     /**
      * Obtiene el valor del color del símbolo APP6 en función del código APP6 de la entidad considerada en base al valor de widget _valorColorAPP6B
      * @returns {[]} valores r, g, b del color
      */
      _obtenerRGB: function(){
        //controlar también los códigos de APP6D. Ahora mismo los pondría de color negro.
        var rgb;
        var codigo = "";

        if(this._valorColorAPP6B !== "" && this._valorColorAPP6B !== null && this._valorColorAPP6B !== "undefined"){
          if(isNaN(this._valorColorAPP6B)){  //isNan(x) comprueba si x es valor numérico. NaN (not a number) devuelve true si es un número. Convierte el string en número primero
            codigo = this._valorColorAPP6B.substring(1, 2).toUpperCase(); //Es APP6B
          }
          else{
            codigo = this._valorColorAPP6B.substring(3, 4).toString(); //Es APP6D
          }
        
          switch(codigo){
            //Pending Unknown, Exercise Pending, Exercise Unknown, None specified --> amarillo
            case "P": case "U": case "G": case "W": case "O": case "0": case "1":
              //rgb=[255,255,128]; //milsymbol.colormode = Light
              rgb=[255,255,0]; //milsymbol.colormode = Medium
              break;
            //Assumed friend, Friend, Exercise friend, Exercise assumed friend --> azul
            case "A": case "F": case "D": case "M": case "2": case "3":
              //rgb=[128,224,255]; //milsymbol.colormode = Light
              rgb=[0,168,220]; //milsymbol.colormode = Medium
              break;
            //Neutral, Exercise neutral --> verde
            case "N": case "L": case "4":
              //rgb=[170,255,170]; //milsymbol.colormode = Light
              rgb=[0,226,110]; //milsymbol.colormode = Medium
              break;
            //Suspect, Hostile, Joker, Faker --> rojo
            case "S": case "H": case "J": case "K": case "5": case "6":
              //rgb=[255,128,128]; //milsymbol.colormode = Light
              rgb=[255,48,49]; //milsymbol.colormode = Medium
              break;
            default:
              rgb = [100,100,100];
          }
        }else{
          rgb=[0,0,0];
        }        
        return rgb;
      },
      
      /**
       * Crea los menús contextuales para cada línea del widget con la identificación de las capas generadas.
       * Para activar y desactiva a la vez todos los elementos asociados a una misma organización y dado que se han creado dos capas distintas (capa de textos y capa de geoemtrías, con puntos y líneas)
       * se manejan a la vez ambas capas, activandolas y desactivandolas a la vez
       * @param {String} IDnodoDeInsercion nombre del nodo en el DOM donde se situará el control
       * @param {GraphicsLayer} capa capa de gráficos de vectores
       * @param {GraphicsLayer} textos capa de gráficos de textos
       */
      _crearMenuContextual:function(IDnodoDeInsercion, capa, textos){
        try{                
          var menu = new Menu({
            targetNodeIds: [IDnodoDeInsercion]
          });

          var padre = this;
          var nid = IDnodoDeInsercion;
          var glyr = capa;
          var tlyr = textos;

          var subMenu = new Menu();
          var subSubMenuTexto = new Menu();
          var subSubMenuLineas = new Menu();
          var subSubSubMenuTipoLineas = new Menu();

          //menu ZOOM
          menu.addChild(new Menuitem({
            label: this.nls.menuContextZoomCapa,
            iconClass: "iconos iconoZoomCapa",
            onClick:function(){
              padre.zoomACapa(glyr);
            }
          }));       

          //menu ELIMINAR
          menu.addChild(new Menuitem({
            label: this.nls.menuContextEliminarCapa,
            iconClass: "iconos iconoBorrarcapa",
            onClick:function(){
              padre.borrarCapaSeleccionada(nid, glyr, tlyr);
            }
          }));

          menu.addChild(new MenuSeparator);        
          //menu SIMBOLIZAR
          menu.addChild(new PopupMenuItem({
            label: this.nls.menuContextSimbologia,
            iconClass:"iconos iconoSimbolizar",
            popup: subMenu
          }));
          
          //submenu ANIMAR/DESANIMAR        
          if(capa.graphics[0].symbol.declaredClass != "esri.symbol.SimpleLineSymbol" && capa.graphics[0].symbol.declaredClass != "esri.symbol.PictureMarkerSymbol"){
            subMenu.addChild(new Menuitem({
              label: this.nls.menuContextAnimacion,
              iconClass:"iconos iconoAnimar",
              onClick:function(){
                padre.animarCapa(glyr, this.id);
              }
            }));

            subMenu.addChild(new MenuSeparator);
          }
          //submenu TEXTO
          subMenu.addChild(new PopupMenuItem({
            label: this.nls.menuContextTexto,              
            iconClass:"iconos iconoTexto",
            popup: subSubMenuTexto
          }));
          //----sub submenu COLOR TEXTO
          var crearControl = new CreadorControles();
          var colorInicial =  new Color(this._colorTexto); //new Color([0, 0, 0]);

          var cpkTexto = crearControl.controlColorPicker(null, false, false, [colorInicial.r, colorInicial.g, colorInicial.b], this.config.paletaColores.treceColores, 11);
          var padre = this;
          
          cpkTexto.on("color-change", function(evt){
            padre.cambiarColorTexto(glyr, tlyr, evt);
          });

          var dialogoColorTexto = new Dialog({
            "title": this.nls.menuContextTextoColor
          });
          dialogoColorTexto.set("content", cpkTexto);       

          subSubMenuTexto.addChild(new Menuitem({   //subSubMenuTexto.addChild(cpkTexto); --> esto funciona, pero no queda claro como meter lo siguiente
            label: this.nls.menuContextTextoColor,
            iconClass:"iconos iconoColor",
            onClick:function(){
              dialogoColorTexto.show();
            },
          }));
          if(textos){
            //----sub submenu TAMAÑO TEXTO
            var tamanioTexto = this._tamanioFuenteIncial;

            var spinTamanioTexto = new NumberSpinner({
              value: tamanioTexto,
              smallDelta: 1,
              constraints: {min: 8, max: 18, places: 0}
            }, null);

            spinTamanioTexto.on("change", function(v){
              if(v !== tamanioTexto){
                tamanioTexto = v;
                padre.cambiarTamanioTexto(tlyr, v)
              }
            });

            var dialogoTamanioTexto = new Dialog({
              "title": this.nls.menuContextTextoTamanio
            });
            dialogoTamanioTexto.set("content", spinTamanioTexto);

            subSubMenuTexto.addChild(new Menuitem({           //subSubMenuTexto.addChild(cpkTexto); --> esto funciona, pero no queda claro como meter lo siguiente
              label: this.nls.menuContextTextoTamanio,
              iconClass:"iconos iconoTTexto",
              onClick:function(){dialogoTamanioTexto.show();},
            }));
            
            subMenu.addChild(new MenuSeparator);
            //submenu LINEAS
            subMenu.addChild(new PopupMenuItem({
              label: this.nls.menuContextLineas,              
              iconClass:"iconos iconoVectores",
              popup: subSubMenuLineas
            }));
            //----sub submenu GROSOR LINEAS
            var grosorLinea = this._anchoLinea;

            var spinGrosorLinea = new NumberSpinner({
              value: grosorLinea,
              smallDelta: 0.5,
              constraints: {min: 0.5, max: 4.5, places: 1, pattern: "#.#"}
            }, null);

            spinGrosorLinea.on("change", function(v){
              if(v != grosorLinea){
                grosorLinea = v;
                padre.cambiarGrosorLinea(glyr, v);
              }
            });
            
            var dialogGrosorLinea = new Dialog({
              "title": this.nls.menuContextLineasGrosor
            });

            dialogGrosorLinea.set("content",spinGrosorLinea);

            subSubMenuLineas.addChild(new Menuitem({
              label: this.nls.menuContextLineasGrosor,
              iconClass:"iconos iconoTLinea",
              onClick: function(){dialogGrosorLinea.show();}
            }));
            //----sub submenu COLOR LINEAS ------------------------------------------------------------------------------
            var crearControl = new CreadorControles();
            var colorInicial = capa.graphics[0].symbol.color; //el que trae la capa

            var cpkLineas = crearControl.controlColorPicker(null, false, false, [colorInicial.r, colorInicial.g, colorInicial.b], this.config.paletaColores.treceColores, 11);
            var padre = this;
            
            cpkLineas.on("color-change", function(evt){
              padre.cambiarColorVector(glyr, evt);
            });

            var dialogoColorLineas = new Dialog({
              "title": this.nls.menuContextLineasColor
            });
            dialogoColorLineas.set("content", cpkLineas);       

            subSubMenuLineas.addChild(new Menuitem({   //subSubMenuTexto.addChild(cpkTexto); --> esto funciona, pero no queda claro como meter lo siguiente
              label: this.nls.menuContextLineasColor,
              iconClass:"iconos iconoColorLinea",
              onClick:function(){
                dialogoColorLineas.show();
              },
            }));        
            //----sub submenu TIPO LINEAS -------------------------------------------------------------------------------
            subSubMenuLineas.addChild(new PopupMenuItem({
              label: this.nls.menuContextLineasTipo,
              iconClass: "iconos iconoTipoLinea",
              popup:subSubSubMenuTipoLineas
            }));

            subSubSubMenuTipoLineas.addChild(new Menuitem({
              label: this.nls.menuContextualTLSolid,
              iconClass: "iconos iconoTLineaSolid",
              onClick: function(){padre.cambiarTipoLinea(glyr, SimpleLineSymbol.STYLE_SOLID);}
            }));

            subSubSubMenuTipoLineas.addChild(new Menuitem({
              label: this.nls.menuContextualTLShort,
              iconClass: "iconos iconoTLineaShortDas",
              onClick: function(){padre.cambiarTipoLinea(glyr, SimpleLineSymbol.STYLE_SHORTDASH);}
            }));

            subSubSubMenuTipoLineas.addChild(new Menuitem({
              label: this.nls.menuContextualTLLong,
              iconClass: "iconos iconoTLineaLongDas",
              onClick: function(){padre.cambiarTipoLinea(glyr, SimpleLineSymbol.STYLE_LONGDASH);}
            }));

            subSubSubMenuTipoLineas.addChild(new Menuitem({
              label: this.nls.menuContextualTLShortDot,
              iconClass: "iconos iconoTLineaShortDasDot",
              onClick: function(){padre.cambiarTipoLinea(glyr, SimpleLineSymbol.STYLE_SHORTDASHDOT);}
            }));

            subSubSubMenuTipoLineas.addChild(new Menuitem({
              label: this.nls.menuContextualTLLongDot,
              iconClass: "iconos iconoTLineaLongDasDot",
              onClick: function(){padre.cambiarTipoLinea(glyr, SimpleLineSymbol.STYLE_LONGDASHDOT);}
            }));

            subSubSubMenuTipoLineas.addChild(new Menuitem({
              label: this.nls.menuContextualTLDot,
              iconClass: "iconos iconoTLineaDot",
              onClick: function(){padre.cambiarTipoLinea(glyr, SimpleLineSymbol.STYLE_DOT);}
            }));
            //Fin Menu
          }
        }catch(error){
          console.error("se ha producido un error en el método '_crearMenuContextual'\n"
          + "con el IDnodoDeInsercion" + IDnodoDeInsercion + "\n" 
          + "capa " + capa + "\n"
          + "textos " + textos +"\n"
          + "datos del error\n"
          + error);
          alert("se ha producido un error en el método '_crearMenuContextual'.\n"
          + "Probablemente sea debido a un error de lectura en la capa del servidor.\n"
          + "Refresque el explorador e inténtelo de nuevo. Si el problema persiste, contacte con Desarrollo de la SAT.");
          this.busyIndicator.hide();
        }
      },

      /**
       * Elimina las capas de vectores y de textos asociados a la vez, además de quitara la línea de control en el cuadro del widget
       * @param {String} IDnodoDeInsercion nombre del nodo en el DOM donde se situará el control
       * @param {GraphicsLayer} capa Capa gráfica de vectores
       * @param {GraphicsLayer} capaTextos Capa gráfica de Textos asociados
       */
      borrarCapaSeleccionada: function(IDnodoDeInsercion, capa, capaTextos){
        var dialogoBorrado = new ConfirmDialog({
          title: this.nls.tituloAlerta,
          content: "<img class='advertencia' src='" + this.folderUrl + 
                   "images/advertencia.png'/><span class='advertenciaTXT'>" + this.nls.contenidoAlerta + "</span>",
          style: "width 300px"
        });

        dialogoBorrado.set("buttonOk", this.nls.alertaOK);
        dialogoBorrado.set("buttonCancel", this.nls.alertaCancel);
        
        dialogoBorrado.on("execute", lang.hitch(this, function(){
          this.map.removeLayer(capa);
          this.map.removeLayer(capaTextos);
          var i = dom.byId(IDnodoDeInsercion).parentElement.parentNode.rowIndex; //índice de fila (span.td.tr) a borrar
          dom.byId(this._nodoListadoCapas).deleteRow(i);
          //volver a ocultar el panel de capas si no queda ninguna tras borrar
          if(dom.byId(this._nodoListadoCapas).rows.length <= 1){
            domStyle.set(dom.byId(this._nodoListadoCapas), "display", "none");
          }
        }));
        dialogoBorrado.on("cancel", function(){});
        dialogoBorrado.show();
      },

      /**
       * Zoom a una capa en función de los elementos que tiene
       * @param {Layer} capa 
       */
      zoomACapa:function(capa){
        
        if(capa.graphics.length == 1 && capa.graphics[0].geometry.type == "point"){
          this.map.centerAndZoom(capa.graphics[0].geometry, 5);
        }else{
          var extent = GraphicsUtils.graphicsExtent(capa.graphics);
          this.map.setExtent(extent.expand(1.40)); //40% más grande
        }        
      },

      /**
       * Si la capa es de tipo DirectionalLineSymbol, permite animar las flechas
       * @param {Layer} capa capa en la que están las líneas de tipo DirectionalLineSymbol
       * @param {*} IDmenuItem Elemento del DOM en el que cambiar información en  función de si están activos o no
       */
      animarCapa:function(capa, IDmenuItem){
        var accion = "desactivar";

        if(dijit.byId(IDmenuItem).label == this.nls.menuContextAnimacion){
          dijit.byId(IDmenuItem).set("label", this.nls.menuContextDesAnimacion);
          dijit.byId(IDmenuItem).set("iconClass", "iconos iconoDesanimar");
          accion = "activar";
        }
        else{
          dijit.byId(IDmenuItem).set("label", this.nls.menuContextAnimacion);
          dijit.byId(IDmenuItem).set("iconClass", "iconos iconoAnimar");
          accion = "desactivar";
        }

        for(i = 0; i < capa.graphics.length; i++){
          if(capa.graphics[i].symbol.type === "DirectionalLineSymbol"){
            switch (accion){
              case "activar":
                capa.graphics[i].symbol.animateDirection("Infinity", 150);
                break;
              case "desactivar":
                capa.graphics[i].symbol.stopAnimation();
                break; 
            }
          }
        }
      },

      /**
       * Cambia el tamaño del texto de un gráfico de tipo texto
       * @param {GraphicsLayer} capa capa que contiene los gráficos de tipo texto
       * @param {*} tamanio Tamaño nuevo del texto
       */
      cambiarTamanioTexto: function(capa, tamanio){
        for(i=0; i<capa.graphics.length; i++){
          capa.graphics[i].symbol.font.setSize(tamanio)
        }
        capa.redraw();
      },

      /**
       * Cambia el color del texto de un gráfico de tipo texto
       * @param {GraphicsLayer} capaGraficos capa en la que está el símbolo APP6 para cambiar el color del texto del símbolo
       * @param {GraphicsLayer} capaTextos Capa en la que están los textos para cambiar el color
       * @param {Event} evento Evento que ha generado la llamada a esta función. En este caso, es un cambio de color seleccionado en un control de tipo ColorPick
       */
      cambiarColorTexto: function(capaGraficos, capaTextos, evento){
        for(i=0; i<capaGraficos.graphics.length; i++){
          if(capaGraficos.graphics[i].symbol.declaredClass == "esri.symbol.PictureMarkerSymbol") { //"esri.symbol.SimpleLineSymbol"){
            var ultimoGr = capaGraficos.graphics[i];
            capaGraficos.remove(capaGraficos.graphics[i]);
            capaGraficos.add(this._obtenerAPP6Graphic(ultimoGr, "rgb(" + evento.color.r + ", " + evento.color.g + ", " + evento.color.b + ")"));
          }
        }
        if(capaTextos){
          for(j=0; j<capaTextos.graphics.length; j++){
            if(capaTextos.graphics[j].symbol.declaredClass == "esri.symbol.TextSymbol"){
              capaTextos.graphics[j].symbol.color.setColor(evento.color);              
            }
            capaTextos.redraw();
          }
        }
      },

      cambiarGrosorLinea: function(capa, grosor){
        for(i=0; i<capa.graphics.length; i++){
          if(capa.graphics[i].symbol.declaredClass == "esri.symbol.SimpleLineSymbol"){
            capa.graphics[i].symbol.setWidth(grosor);
          }
        }
        capa.redraw();
      },

      cambiarColorVector: function(capa, evento){
        if(capa.graphics[0].symbol.color != evento.color){
          for(i=0;i<capa.graphics.length; i++){
            capa.graphics[i].symbol.color.setColor(evento.color);
          }
          capa.redraw();
        }        
      },      

      cambiarTipoLinea: function(capa, estilo){
        if(capa.graphics[0].symbol.style !== estilo){
          for(i=0; i<capa.graphics.length; i++){
          capa.graphics[i].symbol.style = estilo; //setStyle precias de pasarle SimpleLineSymbol.STYLE_XXX, pero al pasarlo desde la otra función, aquí llega el valor, por lo que debe pasarse por propiedad
          }
          capa.redraw();
        }        
      }
    });
  });