define([
    'dojo/_base/declare',
    'dojo/i18n!./nls/strings',
],function(declare, i18nStrings){
    return declare(null, {
        nls: null,
        constructor:function(options){
            this.origen = options.origen;
            this.nls = i18nStrings;
        },

        formatearFecha:function(valor, usarHora){
            var dt = new Date(valor);
            //1.- alternativa new Date(feature.attributes[campoFecha]).toUTCString() porque la fecha que lee en el campo es un número largo en milisegundos        
            //2.- Debe tenerse en cuenta que para el formato de hora que pide APP6B (DDHHMMSSZMONYY)debería ser hora Zulú (UTC), por lo que debería usarse Date.UTC()
            //    Si no se está controlando el formato de entrada en base de datos, no es necesario hacer la conversión
            var resultado = ("0" + dt.getDate()).slice(-2); //agrega un 0 delante si es menor de 10
            
            if(usarHora){
            resultado = resultado + ("0" + dt.getHours()).slice(-2)
            + ("0" + dt.getMinutes()).slice(-2)
            + ("0" + dt.getSeconds()).slice(-2)
            + "Z";
            }

            switch (dt.getMonth()){
            case 0:
                resultado = resultado + this.nls.ene;
            break;
            case 1:
                resultado = resultado + this.nls.feb;
            break;
            case 2:
                resultado = resultado + this.nls.mar;
            break;
            case 3:
                resultado = resultado + this.nls.abr;
            break;
            case 4:
                resultado = resultado + this.nls.may;
            break;
            case 5:
                resultado = resultado + this.nls.jun;
            break;
            case 6:
                resultado = resultado + this.nls.jul;
            break;
            case 7:
                resultado = resultado + this.nls.ago;
            break;
            case 8:
                resultado = resultado + this.nls.sep;
            break;
            case 9:
                resultado = resultado + this.nls.oct;
            break;
            case 10:
                resultado = resultado + this.nls.nov;
            break;
            case 11:
                resultado = resultado + this.nls.dic;
            break;
            }
            resultado = resultado + dt.getFullYear().toString().substr(-2);
            return resultado;
        },

        /**
         * Para un layerInfo, recorre hacia arriba todos los parentLayerInfo y devuelve el resultado, obteniendo la propiea capa si es una featureLayer no anidada
         * O la capa raíz en otro caso
         * @param {esri/layers/LayerInfo} layerInfo LayerInfo a analizar
         * @returns {esri/layers/LayerInfo} LayerInfo resultado 
         */
        getLayerInfoAncestral: function(layerInfo){
            var ramaPricipal = layerInfo;
            //cuando sea nulo o undefined se queda con el último encontrado anterior
            while(ramaPricipal.parentLayerInfo){
                ramaPricipal = ramaPricipal.parentLayerInfo
            }
            return ramaPricipal;
        },

        /**
       * A partir de un número de milisegundos, construye una expresión de lo que esos ms significan en número de años, meses, días, horas, minutos, segundos y milisegundos
       * @param {Number} milisegundos milisegundos de cálculo
       * @returns {String} Cadena conteniendo la descripción del tiempo en formato: x años x meses x dias x h x min x s x ms
       */
        milisegAdescripcion: function(milisegundos){
            var descripcion = "";
    
            if(milisegundos){
                //valores de transformación ms -> distintas medidas de tiempo
                var ms2ye = 3.1536E10;
                var ms2me = 2.628E+9;
                var ms2di = 8.64E+7;
                var ms2hr = 3.6E+6;
                var ms2mi = 6E+4;
                var ms2sg = 1E+3;
        
                var tanios = Math.floor(milisegundos/ms2ye);
                if(tanios > 0){
                    descripcion = tanios + " " + this.nls.anios + " ";
                }
                milisegundos = milisegundos - (tanios*ms2ye);
        
                var tmeses = Math.floor(milisegundos/ms2me);
                if(tmeses > 0){
                    descripcion = descripcion + tmeses + " " + this.nls.meses + " ";
                }
                milisegundos = milisegundos - (tmeses*ms2me);
        
                var tdias = Math.floor(milisegundos/ms2di);
                if(tdias > 0){
                    descripcion = descripcion + tdias + " " + this.nls.dias + " ";
                }
                milisegundos = milisegundos - (tdias*ms2di);
        
                var thoras = Math.floor(milisegundos/ms2hr);
                if(thoras > 0){
                    descripcion = descripcion + thoras + " h ";
                }
                milisegundos = milisegundos - (thoras*ms2hr);
        
                var tmin = Math.floor(milisegundos/ms2mi);
                if(tmin > 0){
                    descripcion = descripcion + tmin + " min ";
                }
                milisegundos = milisegundos - (tmin*ms2mi);
        
                var tseg = Math.floor(milisegundos/ms2sg);
                if(tseg > 0){
                    descripcion = descripcion + tseg + " s ";
                }
                milisegundos = milisegundos - (tseg*ms2sg);
        
                if((milisegundos).toFixed(2) > 0){
                    descripcion = descripcion + (milisegundos).toFixed(2) + " ms";
                }
            }
            return descripcion;
        },

        consolaOpcionesAnalisisAPP6:function(){
            console.info("Se ejecuta simbolización con los siguientes valores: \n"
            + "Campo SIDC: " + this.origen.cCampoAPP6 +  "\n"
            + "Mostrar todas las entidades: " + this.origen._simbolizarTodo + "\n"
            + "Tamaño de símbolo: " + this.origen.oTamanioSimbolo + "\n"
            + "Ancho líneas del simbolo: " +  this.origen.oTamanioAnchoLinea + "\n"
            + "Mostrar designación única: " + this.origen._UsarDesignacionUnica + "\n"
            + "Campo designación única: " + this.origen.cCampoDesignacionUnica + "\n"
            + "Mostrar nombre de país: " + this.origen._usarNombrePais + "\n"
            + "Campo para país: " + this.origen.cCampoPais + "\n"
            + "Mostrar Fecha: " + this.origen._usarFecha + ", Mostrar hora: " + this.origen._usarHora + "\n"
            + "Campo para fecha y hora: " + this.origen.cCampoPais);
          }
    });
});