define([
	"dojo/_base/declare",
	"dijit/form/Select",
	"dijit/form/Button",
	"dijit/form/CheckBox",
	"dijit/form/HorizontalSlider",
  "esri/dijit/HeatmapSlider",
  "esri/dijit/ColorPicker",
  "jimu/dijit/LayerChooserFromMap",
  "jimu/dijit/LayerChooserFromMapWithDropbox",
  "esri/Color",
  //"dojo/Deferred",
  //"jimu/LayerStructure",
	"dojo/domReady"
	],function(declare,
		Select, Button, CheckBox, HorizontalSlider, HeatmapSlider,
    ColorPicker, 
    LayerChooserFromMap, LayerChooserFromMapWithDropbox,
    Color
    //,Deferred, LayerStructure
    ){
    //1a version controlada: 2021.12.16 
		return declare(null, {
			constructor: function(){},
			
      /**
       * 
       * @param {String} nombre OBLIGATORIO. propiedad name. Si no se indica propiead id, entonces id = nombre también
       * @param {String} nodoInsercion OBLIGATORIO. Punto del dom donde se insertará el control
       * @param {String} etiqueta OBLIGATORIO. Texto que mostrará el botón
       * @param {String} id OPCIONAL. Propiedad id que tendrá el control. Si no se indica, entonces será id = name
       * @param {Boolean} desactivado OPCIONAL. Si aparecerá o no desactivado. Por defecto es false
       * @returns 
       */
      controlDojoButton:function(nombre, nodoInsercion, etiqueta, id, desactivado){
        if(!id || id == ""){
          id=nombre;
        }
        if(desactivado != false && desactivado != true){
          desactivado = false;
        }

        new Button({
          name: nombre,
          id: id,
          disabled: desactivado,
          label: etiqueta
        }, nodoInsercion).startup();
        return dojo.byId(id);        
      },
      
      /**
       * 
       * @param {String} nombre OBLIGATORIO. propiedad name. Si no se indica propiead id, entonces id = nombre también
       * @param {String} nodoInsercion OBLIGATORIO. Punto del dom donde se insertará el control 
       * @param {String} id OPCIONAL. Propiedad id que tendrá el control. Si no se indica, entonces será id = name
       * @param {Boolean} desactivado OPCIONAL. Si aparecerá o no desactivado. Por defecto es false
       * @returns 
       */
      controlDijitSelect: function(nombre, nodoInsercion, id, desactivado){
        var _id = nombre;
        var _disabled = false;

        if(id){
          _id = id;
        }

        if(desactivado === true || desactivado === false){
          _disabled = desactivado;
        }

        new Select({
          name: nombre,
          width: "100%",
          disabled: _disabled,
          id: _id,
          class: "selector"
        }, nodoInsercion).startup();

        return dijit.byId(_id); //dojo.byId devuelve el nodo html en el dom
      },
      
      /**
       * 
       * @param {String} nombre OBLIGATORIO. propiedad name. Si no se indica propiead id, entonces id = nombre también
       * @param {String} nodoInsercion OBLIGATORIO. Punto del dom donde se insertará el control 
       * @param {String} id OPCIONAL. Propiedad id que tendrá el control. Si no se indica, entonces será id = name
       * @param {Boolean} desactivado OPCIONAL. Si aparecerá o no desactivado. Por defecto es false
       * @param {Boolean} cheked OPCIONAL. Indica si aparece o no con el check. Por defeto es false
       * @returns 
       */
      controlDojoCheck: function(nombre, nodoInsercion, id, desactivado, cheked){
        var _id = nombre;
        var _disabled = false;
        var _cheked = false;

        if(id){
          _id = id;
        }

        if(desactivado === true || desactivado === false){
          _disabled = desactivado;
        }

        if(cheked === true || cheked === false){
          _cheked = cheked
        }

        new CheckBox({
          name: nombre,
          id: _id,
          checked: _cheked,
          disabled: _disabled,
          }, nodoInsercion).startup();

        return dojo.byId(_id); //dojo.byId devuelve el nodo html en el dom
      },
      
      /**
       * 
       * @param {String} id OPCIONAL. Propiedad id que tendrá el control. Si no se indica, entonces será id = name
       * @param {String} nodoInsercion OBLIGATORIO. Punto del dom donde se insertará el control 
       * @param {Number} min OBLIGATORIO. Valor mínimo de la rampa de valores
       * @param {Number} max OBLIGATORIO. Valor máximo de la rampa de valores
       * @param {Integer} pasos OBLIGATORIO: Número de pasos entre el mínimo y el máximo.
       *                        Depende del incremento por clic ((max-min)/n)+1, siendo n dicho incremento
       * @param {Number} valorInicial OBLIGATORIO. Valor en el que empieza larampa
       * @param {*} desactivado OPCIONAL. Indica si aparece desactivado al inicio. Por defecto false
       * @returns 
       */
      controlDijitHorizontalSlider: function(id, nodoInsercion, min, max, pasos, valorInicial, desactivado){
        var _disabled = false;
        if(desactivado === true || desactivado === false){
          _disabled = desactivado;
        }

        new HorizontalSlider({
          id: id,
          value: valorInicial,
          minimum: min,
          maximum: max,
          discreteValues: pasos,
          style: "width:100%",
          disabled: _disabled
        }, nodoInsercion).startup();

        return dijit.byId(id);
      },
      
      controlDijitHeatmapSlider: function(colorStops, nodoInsercion){
        var colorStops = colorStops;
        //var nodo = nodoInsercion;
        var heatmapSlider = new HeatmapSlider({
          "colorStops": colorStops
        }, nodoInsercion);
        heatmapSlider.startup();
        return heatmapSlider;
      },
      
      /**
       * Desde v02
       * @param {String} nodoInsercion  OBLIGATORIO. Punto del dom donde se insertará el control 
       * @param {Boolean} plegado OPCIONAL. Indica si aparecerá colapsado (true) o desplegado (false). Por defecto false
       * @param {Boolean} plegable OPCIONAL. indica si es o no colapsable. Si este valor es false, pleago no puede ser true. Por defecto false
       * @param {[r, g, b]} arrayRGBcolorPresel OPCIONAL. Color por defecto seleccionado. Por defecto [0, 0, 0]
       * @param {[{color:[r, g, b]}]} paletaColor OBLIGATORIO. Colores de la propieda pallete
       * @param {Integer} numeroColoresPorFila OPCIONAL. Valor por defecto 13
       * @returns 
       */
      controlColorPicker: function(nodoInsercion, plegado, plegable, arrayRGBcolorPresel, paletaColor, numeroColoresPorFila){
        var _plegado = false;
        if(plegado){
          _plegado = plegado;
        }
        
        var _plegable = false;
        if(plegable){
          _plegable = plegable; 
        }

        if(!arrayRGBcolorPresel){
          arrayRGBcolorPresel = [0, 0, 0];
        }
        
        var colorPreseleccionado = new Color.fromArray(arrayRGBcolorPresel);

        if(paletaColor){
          var palette = [];
          for(var i=0; i<paletaColor.length; i++){
            palette.push(new Color(paletaColor[i].color));
          }
        }

        var numColores = 13;
        if(numeroColoresPorFila){ //evalua: != null; != "undefined"; !NaN (Nan: no es un número --> !Nan: es un número); != ""; !=0; != false
          numColores = numeroColoresPorFila;
        } 

        var colorPicker = new ColorPicker({
          collapsed: _plegado,
          collapsible: _plegable,
          color: colorPreseleccionado,
          colorsPerRow: numColores,
          palette: palette,
          required: true, //si false, permite no-color --> transparencia
          showRecentColors: false, //Si muestra o no ultimos colores
          showTransparencySlider: false //Si se muestra o no barra para dar transparencia
        },nodoInsercion);

        colorPicker.startup();
        return colorPicker;
      },
      
      /**
       * Desde v03
       * @param {esriMap} map OBLIGATORIO. Mapa en el que buscar las capas 
       * @param {String} id OBLIGATORIO. identificador del control. El contror LayerChooserFromMap será id-lchooser y el control LayerChooserFromMapWithDropbox será id-lchooser-dropbox
       * @param {String} nodoInsercion OBLIGATORIO. id del nodo donde se insertará el control
       * @param {[]} geometrias OPCIONAL. Array de geometrías. Valor por defecto ['point', 'polyline', 'polygon']
       * @returns {jimu.dijit.LayerChooserFromMapWithDropbox} Control creado y situado en el dom
       */
      controlLayerChooser: function(map, id, nodoInsercion, geometrias){
        if(map && id && nodoInsercion){
          var layerChooser = new LayerChooserFromMap({
            createMapResponse: map.webMapResponse,
            id: id + "-lchooser"
          });

          if(geometrias && geometrias.length > 0){
            var filtroTipo = LayerChooserFromMap.createFeaturelayerFilter(geometrias, false);
            var filtroQLF = LayerChooserFromMap.createQueryableLayerFilter();
            var filtros = [filtroTipo, filtroQLF];
            layerChooser.filter = LayerChooserFromMap.andCombineFilters(filtros);
          }

          var layerChooserDropBox = new LayerChooserFromMapWithDropbox({
            layerChooser: layerChooser,
            id: id + "-lchooser-dropbox"
          }, nodoInsercion);

          return layerChooserDropBox;
        }
        else{
          console.error("No puede generarse el control LayerChooserFromMapWithDropbox \n" + 
          "No se han indicado valores obligatorios (mapa, id o nodoInsercion)");
          return null;
        }
      }
		});
	}
);