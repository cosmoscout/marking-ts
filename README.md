# tasty.js

A Pie- and Marking-Menu Framework in TypeScript.

## Setup
Add `tasty.js` to your HTML File.  
You'll need to include paper.js and lodash separately.
````
<script src="https://unpkg.com/lodash"></script>
<script src="https://unpkg.com/paper"></script>
````

The framework is accessible through the global `tasty` object.

Example Menu:
```javascript
window.onload = () => {
    const menu = new tasty.menu('body' /* The element to place the menu into */, {
        // Configuration object
        // These are the defaults
        main: {
            minDistance: 150,
            minTraceDistance: 175,
            animationDuration: 250,
            enableMaxClickRadius: true,
        },
        geometry: {
            size: 50,
            color: '#575859',
            selectionColor: '#577a85',
            stroke: {
                enabled: true,
                color: 'rgba(62, 62, 64, 1.0)',
                width: 2,
            },
            text: {
                color: '#fff',
            },
            icon: {
                color: '#fff',
            }
        },
        connector: {
            enabled: true,
            color: '#393a3c',
            width: 10,
        },
        arc: {
            enabled: true,
            color: [
                ['#575859', 0.15],
                ['rgba(87, 122, 133, 0.5)', 0.5],
                ['rgba(74, 159, 158, 0.15)', 0.8],
                'rgba(87, 88, 89, 0)'
            ],
            radial: true,
            stroke: {
                enabled: true,
                width: 1,
            }
        },
        scales: {
            parent: 0.5,
            child: 0.5,
            dot: 0.15,
            icon: {
                base: 0.0625,
                solo: 1.6,
                child: 0.7,
            }
        },
        radii: {
            maxClickRadius: 450,
        }
    });
    
    const structure = {
        // There can only be one topmost menu item!
        id: 'Root',
        text: 'Hauptmenü',
        direction: 0,
        icon: 'bars',
        // Add your Items here
        children: [
            {
                id: 'file',
                text: 'Datei',
                icon: 'file',
                direction: 0,
            },
            {
                id: 'tools',
                text: 'Werkzeuge',
                icon: 'tools',
                direction: 90,
                children: [],            
            },
            {
                id: 'project',
                text: 'Projekt',
                icon: 'project-diagram',
                direction: 180,            
            },
            {
                id: 'documents',
                text: 'Dokumente',
                icon: 'file-signature',
                direction: 135,
            }
        ]
    };

    menu.init();
    menu.setStructure(tasty.parser.parse(struct));

    menu.selection$.subscribe(s => {
        if (s.type === 'itemSelection') {
            console.log(s);
        }
    });
}
```

## Menu Structure Definition
The menu structure is defined in JSON.
* `id`: Unique menu identifier 
* `text`: The item's label text
* `direction`: Item position in degrees
* `icon`: Font-Aweseome icon name
* `children`: Optional array with item definitions

````
{
    // There can only be one topmost menu item!
    id: 'Root',
    text: 'Hauptmenü',
    direction: 0,
    icon: 'bars',
    // Add your Items here
    children: [
        {
            id: 'file',
            text: 'Datei',
            icon: 'file',
            direction: 0,
        },
        {
            id: 'tools',
            text: 'Werkzeuge',
            icon: 'tools',
            direction: 90,
            children: [],            
        },
        {
            id: 'project',
            text: 'Projekt',
            icon: 'project-diagram',
            direction: 180,            
        },
        {
            id: 'documents',
            text: 'Dokumente',
            icon: 'file-signature',
            direction: 270,
        }
    ]
}
````

## Menu Status
An observable communicates the current menu status.

```js
menu.selection$.subscribe(event => {
    console.log(event);
});
```

There are six different event types:
* itemSelection: An item with no children was selected
* navigationSubmenu: A navigation into a submenu has occurred
* navigationBack: A navigation back to the parent has occurred
* navigationBackHover: The input device hovers over the back sector
* itemHover: The input device hovers over an item with children
* itemSelectionHover: The input device hovers over an item with no children

Each event object contains three readonly members:  
* `type`: one of the six described types
* `source`: An object containing the currently active `itemId` and the item's `angle`
* `target`: An object containing the target's `itemId` and `angle`




## Ribbonslider
Definition:
```
{
    id: 'slider',
    text: 'Ribbonslider',
    icon: 'sliders-h',
    direction: 0,
    // Indicates the ribbonslider class 
    type: 'ribbonslider',
    data: {
        min: -100,
        max: 100,
        initial: 0,
        stepSize: 10,
        stepDist: 200
    }
}
```

The slider configurations is contained in its `data` field.
* `min`: Slider min value | Cannot be greater than or equal to max
* `max`: Slider max value | Cannot be lower than min
* `initial`: Initial slider value | Cannot be outside the range of min/max
* `stepSize`: Slider step size between values
* `stepDist`: Distance in px between two steps
