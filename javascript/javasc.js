require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/ImageryLayer",
    "esri/widgets/ValuePicker",
    "esri/widgets/Legend",
    "esri/widgets/Expand",
    "esri/core/reactiveUtils",
    "esri/widgets/Sketch",
    "esri/layers/GraphicsLayer",
    "esri/Graphic",
    "esri/geometry/Polygon",
    "esri/widgets/Locate",
    "esri/widgets/Search",
    "esri/widgets/BasemapGallery",
    "esri/Basemap",
    "esri/views/SceneView",
    "esri/core/promiseUtils",
], (Map, MapView, ImageryLayer, ValuePicker, Legend, Expand, reactiveUtils, 
    Sketch, GraphicsLayer, Graphic, Polygon, Locate, Search, BasemapGallery, 
    Basemap, SceneView) =>
    (async () => {
        //Sentinel-2 10m land use/land cover time series image service.
        const layer = new ImageryLayer({
            url: "https://ic.imagery1.arcgis.com/arcgis/rest/services/Sentinel2_10m_LandCover/ImageServer",
            effect: "brightness(100%)", //drop-shadow(2px, 2px, 3px, #000)",
            blendMode: "multiply"
        });
    
        const map = new Map({
            basemap: new Basemap({
              portalItem: {
                id: "0560e29930dc4d5ebeb58c635c0909c9" //3D Topographic Basemap
              }
            }),
            layers: [layer]
          });
        

        const view = new SceneView({
            container: "viewDiv",
            map,
            zoom: 9,
            center: [-49.5511, -28.8591]
        });

        await view.whenLayerView(layer);

        //get the raster functions that are available with the image service
        //service has raster functions that only show specified land cover types
        //add the raster function names to combobox items
        let comboboxItems = [];
        layer.rasterFunctionInfos.forEach((rf) => {
            comboboxItems.push({
                value: rf.name,
                label: rf.name
            });
        });

        //create a new value picker with a combobox component
        const rasterFunctionPicker = new ValuePicker({
            visibleElements: {
                playButton: false
            },
            component: {
                type: "combobox", //autocasts to ValuePickerCombobox
                placeholder: "Pick Land Cover Type",
                items: comboboxItems
            },
            values: [comboboxItems[0].label], // set first item in list to be selected initially
            container: "rasterFunctionPickerDiv"
        });

        //watch the values change on the value picker
        //set the ImageryLayer.rasterFunction - this function
        //will process the image to show only the specified land cover type.
        reactiveUtils.watch(
            () => rasterFunctionPicker.values,
            (values) => {
                layer.rasterFunction = {
                    functionName: rasterFunctionPicker.values[0]
                };
            }
        );

        //set dates between 2017 - 2022
        //image service has the land cover data between 2017 - 2022
        const startDate = new Date(2017, 0, 1);
        const endDate = new Date(2022, 0, 1);
        let currentDate = startDate;

        //create a label component showing years between 2017 - 2022
        //this will be used by the value picker to change view.timeExtent
        const labelComponentForDates = [];
        while (currentDate <= endDate) {
            labelComponentForDates.push({
                value: currentDate.getTime(),
                label: "Land cover in " + currentDate.getFullYear()
            });
            currentDate.setFullYear(currentDate.getFullYear() + 1);
        }

        //create new ValuePicker with label component
        const valuePickerTime = new ValuePicker({
            values: [labelComponentForDates[0].value], // set the starting value to the first date in the array
            component: {
                type: "label", //autocasts to ValuePickerLabel
                items: labelComponentForDates
            },
            playRate: 1500,
            loop: true, //animates through the values on a loop when "play" is pressed
            container: "valuePickerTimeDiv"
        });

        // watch the values change on the value picker update the
        // view.timeExtent show to the land cover for the given year
        reactiveUtils.watch(
            () => valuePickerTime.values,
            (values) => {
                const startDate = new Date(values[0]);
                const endDate = startDate.setFullYear(startDate.getFullYear() + 1);
                view.timeExtent = {
                    start: new Date(values[0]),
                    end: new Date(endDate)
                };
            }
        );

        // add the UI components to the view
        const pickerContainer = document.getElementById("pickerContainer");
        view.ui.add(pickerContainer, "top-right");

        const legendExpand = new Expand({
            expandTooltip: "Show Legend",
            expanded: false,
            view: view,
            content: new Legend({ view })
        });
        view.ui.add(legendExpand, "top-left");

        // Create a GraphicsLayer for the highlighted geometry
        const graphicsLayer = new GraphicsLayer();
        map.add(graphicsLayer);

        // Define the geometry
        const coordinates = [
            [-50.083923, -29.226493]]
           
        const polygon = new Polygon({
            rings: [coordinates],
            spatialReference: view.spatialReference
        });

        // Create a graphic for the polygon
        const polygonGraphic = new Graphic({
            geometry: polygon,
            symbol: {
                type: "simple-fill",
                color: ["0, 255, 0, 0.3"], // Semi-transparent green
                outline: {
                    color: "yellow",
                    width: 2
                }
            }
        });

        // Add the graphic to the graphics layer
        graphicsLayer.add(polygonGraphic);

        // Optionally, add a Sketch widget to edit the polygon
        const sketch = new Sketch({
            layer: graphicsLayer,
            view: view,
            creationMode: "update",
            updateOnGraphicClick: true
        });
        view.ui.add(sketch, "top-right");
        
        //location
        const locateBtn = new Locate({
            view: view
          });
          view.ui.add(locateBtn, {
            position: "top-left"
          });

          //search location
          const search = new Search({
            view: view
          });
          view.ui.add(search, "top-right");
    
          //galeria de basemap API arcgis
          const basemapGallery = new BasemapGallery({
            view: view
          });
  
          // Add the widget to the top-right corner of the view
          view.ui.add(basemapGallery, {
            position: "top-right"
          });
          


    })());
