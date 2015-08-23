var START_TIME = currentTime();

function cell(x,y) {
    this.x = x;
    this.y = y;
    this.visited = false;
    this.neighbors = [];
    this.next = null;
    this.prev = null;
    this.path = null;
}

function path(start_cell) {
    this.start = start_cell;
    this.end = start_cell;
    this.length = 1;
}

var MOUSE = {
    px: -1.0,
    py: -1.0,
    x: -1,
    y: -1,
    down: false,
    path: null
}

var WIDTH_LEFT = {
    x: screenWidth*0.1,
    y: screenHeight*0.32,
    width: screenWidth*0.05,
    height: screenWidth*0.05
}

var WIDTH_RIGHT = {
    x: screenWidth*0.25,
    y: screenHeight*0.32,
    width: screenWidth*0.05,
    height: screenWidth*0.05
}

var HEIGHT_LEFT = {
    x: screenWidth*0.1,
    y: screenHeight*0.52,
    width: screenWidth*0.05,
    height: screenWidth*0.05
}

var HEIGHT_RIGHT = {
    x: screenWidth*0.25,
    y: screenHeight*0.52,
    width: screenWidth*0.05,
    height: screenWidth*0.05
}

var CREATE_NEW = {
    x: screenWidth*0.1,
    y: screenHeight*0.67,
    width: screenWidth*0.2,
    height: screenWidth*0.05
}

var REFRESH = {
    x: screenWidth*0.1,
    y: screenHeight*0.8,
    width: screenWidth*0.2,
    height: screenWidth*0.05
}

var Title = loadImage("Title.png");
var Left_Button = loadImage("Left-Button.png");
var Right_Button = loadImage("Right-Button.png");

var buttons = [WIDTH_LEFT,WIDTH_RIGHT,HEIGHT_LEFT,HEIGHT_RIGHT,CREATE_NEW,REFRESH];

var width = 5;
var width_counter = width;
var height = 5;
var height_counter = height;
var offsetx = canvas.width * 0.4;
var offsety = canvas.height * 0.1;
var scale;

var PAUSED = false;
var victory = "perfect";
var grid = [];
resetGrid();
var path_list = [];

colors = [  [1,0,0], //red
            [0,1,0], //green
            [0,0,1], //blue
            [1,1,0], //yellow
            [1,.5,0], //orange
            [0,1,1], //light blue
            [1,0,1], //pink
            [.6,0,.9], //light purple
            [.7,.7,.7], //light gray
            [.5,0,0], //dark red
            [0,.4,0], //dark green
            [0,0,.4], //dark blue
            [.3,0,.3], //purple
            [0,.3,.3], //dark blue-green
            [.3,.3,.3]]; //gray


///////////////////////////////////////////////////////////////
//                                                           //
//                      SETUP RULES                          //
//                                                           //
///////////////////////////////////////////////////////////////


function createGame() {
    if (height >= width) {
        scale = (canvas.height*0.8)/height;
        offsetx = (canvas.width * 0.4) + (height-width)*scale/2;
        offsety = (canvas.height * 0.1);
    } else {
        scale = (canvas.width*0.55)/width;
        offsetx = (canvas.width * 0.4);
        offsety = (canvas.height * 0.1) + (width-height)*scale/2;
    }
    var finished = false;
    while (!finished) {
        resetGrid();
        path_list = [];
        createMaze();
        createPaths();
        fillPaths();
        simplify_paths();
        if (path_list.length <= colors.length) {
            finished = true;
            for (var j=0; j<path_list.length; j++) {
                if (path_list[j].length < 3) {
                    finished = false;
                }
            }
        }
    }
    resetPaths();
}

//--------------------------------------------------------------------------------------------------

function getUnvisitedNeighbors(current,previous) {
    var x = current.x;
    var y = current.y;
    var unvisited = [];
    var adjacent = [[1,0],[-1,0],[0,1],[0,-1]];
    for (var i=0; i<adjacent.length; i++) {
        var ax = adjacent[i][0];
        var ay = adjacent[i][1];
        if ( x+ax > -1 && y+ay > -1 && x+ax < grid.length && y+ay < grid[x].length ) {
            var test = grid[x+ax][y+ay];
            if (!test.visited) {
                unvisited.push(test);
            }
        }
    }
    // position 0 should be the "straight" option
    if (previous != null) {
        x = current.x + (current.x-previous.x);
        y = current.y + (current.y-previous.y);
        if ( x > -1 && y > -1 && x < grid.length && y < grid[x].length ) {
            var straight = grid[x][y];
            var index = unvisited.indexOf(straight);
            if (index > -1) {
                var temp = unvisited[0];
                unvisited[0] = unvisited[index];
                unvisited[index] = temp;
            }
        }
    }
    return unvisited;
}


//--------------------------------------------------------------------------------------------------

function getEmptyNeighbors(cell) {
    var empty = [];
    for (var i=0; i<cell.neighbors.length; i++) {
        var n = cell.neighbors[i];
        if (n.path == null) {
            empty.push(n);
        }
    }
    return empty;
}


//--------------------------------------------------------------------------------------------------

function createMaze() {
    var sx = randomInteger(0,grid.length-1);
    var sy = randomInteger(0,grid[sx].length-1);
    var current = grid[sx][sy];
    var previous = null;
    current.visited = true;
    var stack = [];
    do {
        var neighbors = getUnvisitedNeighbors(current,previous);
        if (neighbors.length > 0) {
            stack.push(current);
            var r = randomInteger(0,neighbors.length-1);
            if (previous != null) {
                r = randomInteger(0,neighbors.length);
                if (r == neighbors.length) { r = 0; }
            }
            var next = neighbors[r];
            current.neighbors.push(next);
            next.neighbors.push(current);
            next.visited = true;
            previous = current;
            current = next;
        }
        else {
            current = stack.pop();
            previous = null;
        }        
    } while (stack.length > 0);
}


//--------------------------------------------------------------------------------------------------


function createPaths() {
    for (var i=0; i<grid.length; i++) {
        for (var j=0; j<grid[i].length; j++) {
            var next = grid[i][j];
            next.visited = false;
            if (next.neighbors.length == 1) {
                new_path = new path(next);
                next.visited = true;
                next.path = new_path;
                path_list.push(new_path);
            }
        }
    }
}

//--------------------------------------------------------------------------------------------------

function fillPaths() {
    var unvisited = true;
    while (unvisited) {
        unvisited = false;
        for (var i=0; i<path_list.length; i++) {
            var current_path = path_list[i];
            var tail = current_path.end;
            var empty_neighbors = getEmptyNeighbors(tail);
            if (empty_neighbors.length > 0) {
                unvisited = true;
                if (empty_neighbors.length == 1) {
                    var n = empty_neighbors[0];
                    n.prev = tail;
                    if ( testOverlap(n, current_path) ) { 
                        var new_path = new path(n);
                        n.visited = true;
                        n.path = new_path;
                        n.prev = null;
                        path_list.push(new_path);
                    }   
                    else {
                        tail.next = n;
                        n.prev = tail;
                        n.path = current_path;
                        current_path.end = n;
                        current_path.length += 1;
                    }
                }
            }
        }
    }
}

//--------------------------------------------------------------------------------------------------

function simplify_paths() {
    for (var i=0; i<path_list.length-1; i++) {
        var path1 = path_list[i];
        for (var j=i+1; j<path_list.length; j++) {
            var path2 = path_list[j];
            if ( distance(path1.end,path2.end) == 1 && !testOverlapPath(path1.start, null, path2) ) {
                reversePath(path2);
                combinePaths(path1,path2);
            }
        }
    }
}


///////////////////////////////////////////////////////////////
//                                                           //
//                       DRAW RULES                          //
//                                                           //
///////////////////////////////////////////////////////////////


function drawMenu() {
    drawImage(Title,0.03*screenWidth,0.1*screenHeight,0.35*screenWidth,0.1*screenHeight);
    fillText(   "width",WIDTH_LEFT.x+(WIDTH_RIGHT.x-WIDTH_LEFT.x)/1.5,WIDTH_LEFT.y-1.1*WIDTH_LEFT.height,
                makeColor(1,1,1,1),"80px sans-serif","center","top");
    drawImage(Left_Button,WIDTH_LEFT.x,WIDTH_LEFT.y,WIDTH_LEFT.width,WIDTH_LEFT.height);
    fillText(   width_counter,WIDTH_LEFT.x+(WIDTH_RIGHT.x-WIDTH_LEFT.x)/1.5,WIDTH_LEFT.y,
                makeColor(1,1,1,1),"110px sans-serif","center","top");
    drawImage(Right_Button,WIDTH_RIGHT.x,WIDTH_RIGHT.y,WIDTH_RIGHT.width,WIDTH_RIGHT.height);
    fillText(   "height",HEIGHT_LEFT.x+(HEIGHT_RIGHT.x-HEIGHT_LEFT.x)/1.5,HEIGHT_LEFT.y-1.1*HEIGHT_LEFT.height,
                makeColor(1,1,1,1),"80px sans-serif","center","top");
    drawImage(Left_Button,HEIGHT_LEFT.x,HEIGHT_LEFT.y,HEIGHT_LEFT.width,HEIGHT_LEFT.height);
    fillText(   height_counter,HEIGHT_LEFT.x+(HEIGHT_RIGHT.x-HEIGHT_LEFT.x)/1.5,HEIGHT_LEFT.y,
                makeColor(1,1,1,1),"110px sans-serif","center","top");
    drawImage(Right_Button,HEIGHT_RIGHT.x,HEIGHT_RIGHT.y,HEIGHT_RIGHT.width,HEIGHT_RIGHT.height);
    strokeRectangle(CREATE_NEW.x,CREATE_NEW.y,CREATE_NEW.width,CREATE_NEW.height,makeColor(1,1,1,1),8,5);
    fillText(   "create new",CREATE_NEW.x+0.5*CREATE_NEW.width,CREATE_NEW.y+0.5*CREATE_NEW.height,
                makeColor(1,1,1,1),"60px sans-serif","center","middle");
    strokeRectangle(REFRESH.x,REFRESH.y,REFRESH.width,REFRESH.height,makeColor(1,1,1,1),8,5);
    fillText(   "refresh",REFRESH.x+0.5*REFRESH.width,REFRESH.y+0.5*REFRESH.height,
                makeColor(1,1,1,1),"60px sans-serif","center","middle");
    for (var i=0; i<buttons.length; i++) {
        var b = buttons[i];
        if (    MOUSE.px > b.x && MOUSE.px < (b.x + b.width) &&
                MOUSE.py > b.y && MOUSE.py < (b.y + b.height) ) {
            strokeRectangle(b.x,b.y,b.width,b.height,makeColor(.6,1,1,1),10,5);
        }
    }
    if (PAUSED) {
        fillRectangle(screenWidth*0.441,screenHeight*0.35,screenWidth*0.45,screenHeight*0.3,makeColor(0.05,0.05,0.05,0.95));
        strokeRectangle(screenWidth*0.441,screenHeight*0.35,screenWidth*0.45,screenHeight*0.3,makeColor(1,1,1,1),20,10);
        if (victory == "correct") {
            fillText("Level complete!",screenWidth*0.665,screenHeight*0.45,makeColor(1,1,1,1),"80px sans-serif","center","middle");
            fillText("but a perfect solution has",screenWidth*0.665,screenHeight*0.52,makeColor(1,1,1,1),"40px sans-serif","center","middle");
            fillText("no overlapping flows.",screenWidth*0.665,screenHeight*0.56,makeColor(1,1,1,1),"40px sans-serif","center","middle");
        }
        else if (victory == "perfect") {
            fillText("Level complete!",screenWidth*0.665,screenHeight*0.45,makeColor(1,1,1,1),"80px sans-serif","center","middle");
            fillText("You found the optimal solution.",screenWidth*0.665,screenHeight*0.52,makeColor(1,1,1,1),"40px sans-serif","center","middle");
            fillText("Well done!",screenWidth*0.665,screenHeight*0.56,makeColor(1,1,1,1),"40px sans-serif","center","middle");
        }
    }
}

//--------------------------------------------------------------------------------------------------

function drawGrid() {
    for (var i=0; i<=grid.length; i++) {
        strokeLine(offsetx+i*scale,offsety,offsetx+i*scale,offsety+scale*grid[0].length,makeColor(0.9,0.9,0.9,1),5);
    }
    for (var i=0; i<=grid[0].length; i++) {
        strokeLine(offsetx,offsety+i*scale,offsetx+grid.length*scale,offsety+i*scale,makeColor(0.9,0.9,0.9,1),5);
    }
}


//--------------------------------------------------------------------------------------------------


function drawMaze() {
    for (var x=0; x<grid.length; x++) {
        for (var y=0; y<grid[x].length; y++) {
            var current = grid[x][y]
            fillCircle(offsetx+x*scale,offsety+y*scale,scale/4.0,makeColor(1,1,1,1));
            for (var n=0; n<current.neighbors.length; n++) {
                var next = current.neighbors[n];
                if (current.path == next.path) {
                    strokeLine(offsetx+x*scale,offsety+y*scale,offsetx+next.x*scale,offsety+next.y*scale,makeColor(1,1,1,1),scale/2.0);
                }
                else {
                    strokeLine(offsetx+x*scale,offsety+y*scale,offsetx+next.x*scale,offsety+next.y*scale,makeColor(1,1,1,1),scale/2.0);                 
                }
            }
        }
    }
}


//--------------------------------------------------------------------------------------------------

function drawPaths() {
    for (var i=0; i<path_list.length; i++) {
        var current = path_list[i].start;
        var fillColor = makeColor(colors[i][0],colors[i][1],colors[i][2],1);
        var fadeColor = makeColor(colors[i][0],colors[i][1],colors[i][2],0.5);
        if (current.next != null && !(MOUSE.down == true && MOUSE.path == path_list[i]) ) { 
            fillRectangle(offsetx+current.x*scale,offsety+current.y*scale,scale,scale,fadeColor);
        }
        fillCircle(offsetx+(current.x+0.5)*scale,offsety+(current.y+0.5)*scale,scale/2.5,fillColor);
        var previous = current;
        current = current.next;
        while (current != null) {
            if ( !(MOUSE.down == true && MOUSE.path == path_list[i]) ) {
                fillRectangle(offsetx+current.x*scale,offsety+current.y*scale,scale,scale,fadeColor);
            }
            fillCircle(offsetx+(current.x+0.5)*scale,offsety+(current.y+0.5)*scale,scale/4.0,fillColor);
            strokeLine( offsetx+(previous.x+0.5)*scale,offsety+(previous.y+0.5)*scale,
                        offsetx+(current.x+0.5)*scale,offsety+(current.y+0.5)*scale,fillColor,scale/2.0);
            
            previous = current;
            current = current.next;
        }
        current = path_list[i].end;
        fillCircle(offsetx+(current.x+0.5)*scale,offsety+(current.y+0.5)*scale,scale/2.5,fillColor);
    }
}


///////////////////////////////////////////////////////////////
//                                                           //
//                       GAME RULES                          //
//                                                           //
///////////////////////////////////////////////////////////////


function onSetup() {
    createGame();
}

function onTick() {
    doGraphics();
}

//--------------------------------------------------------------------------------------------------

function doGraphics() {
    fillRectangle(0, 0, screenWidth, screenHeight,makeColor(.05,.05,.05,1));
    drawGrid();
    //drawMaze();
    drawPaths();
    drawMenu();
}

//--------------------------------------------------------------------------------------------------

function onKeyStart(key) {
    if (key == 32) {
        simplify_paths();
    }
}

function selectPathFromCell(selected_path,selected_cell) {
    if (selected_cell == selected_path.end) {
        resetPath(selected_path,selected_path.start);
        reversePath(selected_path);
    }
    else if (selected_cell == selected_path.start) {
        resetPath(selected_path,selected_path.start);
    }
    selected_path.length = 1;
    MOUSE.path = selected_path;
}

function activateButton(button) {
    if (button == WIDTH_LEFT) {
        width_counter = max(5,width_counter-1);
    }
    else if (button == WIDTH_RIGHT) {
        width_counter = min(9,width_counter+1);
    }
    else if (button == HEIGHT_LEFT) {
        height_counter = max(5,height_counter-1);
    }
    else if (button == HEIGHT_RIGHT) {
        height_counter = min(9,height_counter+1);
    }
    else if (button == CREATE_NEW) {
        PAUSED = false;
        width = width_counter;
        height = height_counter;
        createGame();
    }
    else if (button == REFRESH) {
        PAUSED = false;
        resetPaths();
    }
}

function onTouchStart(x,y) {
    getGridLocation(x,y);
    MOUSE.down = true;
    if (!PAUSED && MOUSE.x > -1 && MOUSE.y > -1) {
        var selected_cell = grid[MOUSE.x][MOUSE.y];
        var selected_path = selected_cell.path;
        if (selected_path != null) {
            if (selected_cell.next == null || selected_cell == selected_path.start) {
                selectPathFromCell(selected_path,selected_cell);
            }
            else if (selected_cell.next != null) {
                resetPath(selected_path,selected_cell.next);
                selected_cell.next = null;
                MOUSE.path = selected_path;
            }
        }
    }
    else {
        for (var i=0; i<buttons.length; i++) {
            var b = buttons[i];
            if (    x > b.x && x < (b.x + b.width) &&
                    y > b.y && y < (b.y + b.height) ) {
                activateButton(b);
            }
        }
    }
}

function onTouchEnd(x,y) {
    MOUSE.down = false;
    MOUSE.path = null;
    MOUSE.x = -1;
    MOUSE.y = -1;
    if (!PAUSED) {
        victory = testVictory();
        if (victory != "false") {
            PAUSED = true;
        }
    }
}

function onMouseMove(x,y) {
    MOUSE.px = x;
    MOUSE.py = y;
}

function onTouchMove(x,y) {
    if (!PAUSED && MOUSE.down == true && MOUSE.path != null) {
        var starting_cell = grid[MOUSE.x][MOUSE.y];
        var starting_path = starting_cell.path;
        getGridLocation(x,y);
        if (MOUSE.x > -1 && MOUSE.y > -1) {
            var selected_cell = grid[MOUSE.x][MOUSE.y];
            var selected_path = selected_cell.path;
            if (distance(starting_cell,selected_cell) == 1) {
                if (selected_cell.path == null || selected_cell == starting_cell.path.end) { 
                    starting_cell.next = selected_cell;
                    selected_cell.prev = starting_cell;
                    selected_cell.path = starting_path;
                    starting_path.length += 1;
                    if (selected_cell == starting_cell.path.end) {
                        MOUSE.path = null;
                    }
                } 
                else if (starting_cell.prev == selected_cell) {
                    selected_cell.path.length -= 1;
                    starting_cell.path = null;
                    starting_cell.prev = null;
                    selected_cell.next = null;
                }
                else if (   selected_path != starting_path && 
                            selected_cell != selected_path.start &&
                            selected_cell != selected_path.end ) {
                    selected_cell.prev.next = null;
                    resetPath(selected_path,selected_cell);
                    starting_cell.next = selected_cell;
                    selected_cell.prev = starting_cell;
                    selected_cell.path = starting_path;
                    starting_path.length += 1;
                }
                else { MOUSE.path = null; }
            } else if (selected_cell != starting_cell ) { MOUSE.path = null; }
        } else { MOUSE.path = null; }
    }
}

//--------------------------------------------------------------------------------------------------

function getGridLocation(px, py) {
    var x = floor((px - offsetx) / scale);
    var y = floor((py - offsety) / scale);
    if (x < 0 || x >= grid.length || y < 0 || y >= grid[0].length) { 
        x = -1; 
        y = -1; 
    }
    MOUSE.x = x;
    MOUSE.y = y;
}

///////////////////////////////////////////////////////////////
//                                                           //
//                      HELPER RULES                         //
//                                                           //
///////////////////////////////////////////////////////////////


function contains(list, element) {
    return list.indexOf(element) != -1;
}

//--------------------------------------------------------------------------------------------------

function distance(cell1, cell2) {
    return abs(cell1.x - cell2.x) + abs(cell1.y - cell2.y);
}

//--------------------------------------------------------------------------------------------------

function testVictory() {
    var perfect = true;
    for (var i=0; i<grid.length-1; i++) {
        for (var j=0; j<grid[i].length-1; j++) {
            if (grid[i][j].path == null || grid[i+1][j].path == null || 
                grid[i][j+1].path == null || grid[i+1][j+1].path == null) {
                return "false";
            }
            else if (   grid[i][j].path == grid[i+1][j].path && grid[i][j].path == grid[i][j+1].path &&
                        grid[i][j].path == grid[i+1][j+1].path) {
                perfect = false;
            }
        }
    }
    for (var i=0; i<path_list.length; i++) {
        if (path_list[i].end.prev == null || path_list[i].start.next == null) {
            return "false";
        }
    }
    if (perfect) {
        return "perfect";
    }
    return "correct";
}

//--------------------------------------------------------------------------------------------------
function reversePath(current_path) {
    var previous = current_path.start;
    var current = previous.next;
    previous.next = null;
    while (current != null) {
        var temp = current.next;
        current.next = previous;    
        previous.prev = current;
        previous = current;
        current = temp;
    }
    previous.prev = null;
    temp = current_path.start;
    current_path.start = current_path.end;
    current_path.end = temp;
}

//--------------------------------------------------------------------------------------------------

// pre: path1 start is adjacent to path2 end
function combinePaths(path1,path2) {
    path1.end.next = path2.start;
    var current = path1.end.next;
    current.prev = path1.end;
    while (current != null) {
        current.path = path1;
        current = current.next;
    }
    path1.end = path2.end;
    var index = path_list.indexOf(path2);
    path_list.splice(index,1);
}

//--------------------------------------------------------------------------------------------------

function resetGrid() {
    grid = [];
    for (var i=0; i<width; i++) {
        grid.push([]);
        for (var j=0; j<height; j++) {
            grid[i].push(new cell(i,j));
        }
    }
}

//--------------------------------------------------------------------------------------------------

function resetPath(current_path,start_cell) {
    var temp;
    var current = start_cell;
    var count = 0;
    while (current != null) {
        temp = current.next;
        current.prev = null;
        current.next = null;
        current.path = null;
        current = temp;
        count += 1;
    }
    current_path.start.path = current_path;
    current_path.end.path = current_path;
    current_path.length -= count;
}

function resetPaths() {
    for (var i=0; i<path_list.length; i++) {
        var current_path = path_list[i];
        resetPath(current_path,current_path.start);
    }
}

//--------------------------------------------------------------------------------------------------


function resetVisited() {
    for (var i=0; i<grid.length; i++) {
        for (var j=0; j<grid[i].length; j++) {
            grid[i][j].visited = false;
        }
    }
}


//--------------------------------------------------------------------------------------------------

function testOverlap(test_cell, test_path) {
    var adjacent = [[1,0],[-1,0],[0,1],[0,-1]];
    for (var i=0; i<adjacent.length; i++) {
        var ax = adjacent[i][0];
        var ay = adjacent[i][1];
        if (    test_cell.x+ax > -1 && test_cell.y+ay > -1 && test_cell.x+ax < grid.length && 
                test_cell.y+ay < grid[test_cell.x].length ) {
            var test = grid[test_cell.x+ax][test_cell.y+ay];
            if ( test != test_cell.prev && test.path == test_path) {
                if ( !(test == test_path.end && test_cell == test_cell.path.end) ) {
                    return true;
                }
            }
        }
    }
    return false;

}

//--------------------------------------------------------------------------------------------------

function testOverlapPath(start, end, test_path) {
    while (start != end) {
        if (testOverlap(start,test_path)) {
            return true;
        }
        start = start.next;
    }
    return false;
}


//--------------------------------------------------------------------------------------------------