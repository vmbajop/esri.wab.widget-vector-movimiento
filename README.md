# La llamada desde el widget de Guardar Mapa
Ver documentación sobre *ArcGis Web AppBuilder > Guide > Widget development > communication between widgets* ([enlace](https://developers.arcgis.com/web-appbuilder/guide/communication-between-widgets.htm)).

Instalando WebAppicationBuilder se tiene un mapa accesible como *ArcGIS Web Application - Demo Widgets*. En ella hay dos widgets, A y B, que se comunican entre ellos.
## Control de la llamada desde el widget GuardarMapa
1. Método **startup()**, línea <code>this.fetchDataByName(this._nombreWidgetCargaConfiguracionesMapa)</code>;
2. Método **onReceiveData()**
   * Es obligatorio cuando se desarrolla la comunicación entre widgets.
3. Método **_onReceiveDataIterator()**.
   * Se crea para controlar las iteraciones que pasan cada ID al método de generación de capas, que no puede hacerse mediante un *for()* porque el tránsito es *Deferred*.

# Funcionamiento del widget en comunicación con GuardarMapa
## La estructura del widget pretende lo siguiente:

- Conocer los IDs involucrados en la creación de los vectores guardados.
- Teniendo los vectores guardados, recuperar sus "symbol", tanto de texto como de vectores.
- Descubrir elementos que cumplen la Query pero que no han sido guardados.

Estos serán casos en los que se cumple la Query, que no fueron guardados porque en su momento no existían y que, por tanto, se simbolizarán con el símbolo por defecto.

## Método onReceiveData(name, widgetId, data, historyData)

- Su estructura es estándar, sacada de la ayuda para comunicación entre widgets.
    
- El valor *data* es el único de los que vienen que se usa en este caso. Se alamacena en **mData** para ampliar el alcance de la variable al método **_onReceiveDataIterator()**, al igual que se hace con **mIterator**.

- **mVieneDeonReceiveData()** es un valor buleano para controlar si viene o no de una lectura de un json mediante el widget de Guardar Mapa. Controla el flujo en la función de generación de vectores, diferenciando si la llamada viene del uso del propio Widget de Vectores o del de Guardar Mapa.

- **idCapa** almacena el ID de la capa de origen. Si el valor que viene del widget de Guardar Mapa es de un servicio de tipo *DynamicMapServiceLayer*, la forma será similar a *12345666554321_n*, donde *"n"* indica el número de capa. **idCapa** almacenrá todo lo que va antes de *"_"*.

- **mExtensionURL** almacena el número de capa, que será lo que va después del *"_"* en el caso anterior, es decir: *"n"*.

- Con **LayerStructure.getInstance()** se intenta tomar el layerInfo de la capa anterior para pasarlo y que el widget funcione igual que en el caso general (sin llamada desde el widget de Guardar Mapa)

### Query y QueryTask

- La Query tiene:
    - <code>queryRecuperada.outFields = [this._campoWhere, this._campoNombre]</code>

        Sólo salen los campos de identificación única de la entidad (no de la posición) y del nombre de la entidad
    - <code>queryRecuperada.where = this._capaSeleccionada.layerDefinitions[this.mExtensionURL]</code>
        
        Toma como filtro el mismo con el que fue guardada la capa que genera los vectores
- La QueryTask genera:
    - El array **mIDsCumplenQueryGuardada[]** que guarda los IDs que cumplen la query anterior
    - El array **mIDsGuardadosEnJson[]** que almacena los IDs guardados en el JSON desde el widget Guardar Mapa

## Método _onReceiveDataIterator()

En **_onReceiveDataIterator** se controla el envío de todos los valores a la función de creación de vectores **_generarCapasGraficas()**.

La entrada <code>if(this.mIterador < this.mContador)</code> se corresponde con un <code>for()</code>, reenviando desde la función **_generarCapasGraficas()** un nuevo valor ++, cuando allí se cierra la generación diferida (Deferred).

Se comprueba en <code>this.mIDsGuardadosEnJson.indexOf(idATratar) > -1</code> si el valor actual de ID está entre los guardados:
- Si lo está, se envía para generar los vectores, pero asignando primero los valores de tipo de línea, tipo de texto y color de texto.
- Si no lo está, se envía para generar el vector, sin cambiar los valores por defecto para valores de tipo de línea, tipo de texto y color de texto, que han sido reseteados a su valor por defecto al entrar en cada nueva iteración.
La salida (<code>else{}</code>) del widget se hace reasignando todos los valores a sus valores por defecto.

# Flujo de información entre los widgets GuardarMapa --> Vectoresmovimiento
## Diagrama de flujo de trabajo para la restitución de los Vectores de Movimiento
![Diagrama de flujo](./Flujo.png)
Puede verse en el diagrama de flujo que:
### Desde VectoreMovimiento
1. En el widget de VectoresMovimiento se inicia la UI generando los controles.
2. Luego se ejecuta el método <code>obtenerValoresUnicos()</code>, que crea una lista con todos los valores únicos con los IDs de cada una de las organizaciones en seguimiento.
   * Lee la DefinitionExpression o la LayerDefinition que viene en la capa. 
   * Se toman los OII_OBJECT_ID (ids) de la organización *(en el histórico, todas las posiciones de una misma organización tiene el mismo id de organización (OII_OBJECT_ID) y se diferencian por el SE_SDO_ROWID)* y se almacenan en el array valorUnico[], supuestamente ordenados alfabéticamente (no termina de funcionar bien), para usarlo como elemento d comprobación de que el valor no ha sido ya tomado (<code>if(valorUnico !== null && valoresUnicos.indexOf(valorUnico) == -1)</code>)
3. Por cada valor se ejecuta el método <code>_generarCapasGraficas()</code> que es la que genera la `capa de vectores` + `capa de textos` con la última posición simbolizada mediante APP6.
De nuevo se vuelve a usar el campo 
4. Se ejecutan el resto de métodos para crear los distintos elementos auxiliares de la interfaz etc, mostrándose finalmente en la leyenda que se crea en la UI del widget OII_OBJECT_ID, lo que dará todas las posiciones de cada organización, recorriendolos de dos en dos y generando un vector entre cada par.
### Desde GuardarMapa
1. Al llamar al widget VectorMovimiento, este recibe los datos mediante onReceiveData() y gestiona el flujo mediante onReceiveDataIterator (ver más arriba).
2. En este punto se está en el mismo punto que en el punto 3 anterior, iterando para cada elemento distinto generando su gráfico con sus respectivas capas.
