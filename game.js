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

var width = 7;
var height = 7;
var offsetx = canvas.width * 0.3;
var offsety = canvas.height * 0.1;

var grid = [];
resetGrid();
var path_list = [];

colors = [  [1,0,0],
            [0,1,0],
            [0,0,1],
            [1,1,0],
            [1,0,1],
            [0,1,1],
            [.75,.75,.75],
            [1,.5,0],
            [1,0,.5],
            [.5,1,0],
            [0,1,.5],
            [.5,0,1],
            [0,.5,1],
            [.5,.5,.5],
            [.5,.5,0],
            [.5,0,.5],
            [0,.5,.5],
            [.5,0,0],
            [0,.5,0],
            [0,0,.5],
            [.25,.25,.25]];


///////////////////////////////////////////////////////////////
//                                                           //
//                      SETUP RULES                          //
//                                                           //
///////////////////////////////////////////////////////////////


function createGame() {
    var finished = false;
    while (!finished) {
        resetGrid();
        path_list = [];
        createMaze();
        createPaths();
        fillPaths();
        simplify_paths();
        if (path_list.length < colors.length) {
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


function drawGrid() {
    var scale;
    if (height >= width) {
        scale = (canvas.height*0.8)/height;
    } else {
        scale = (canvas.width*0.6)/width;
    }
    for (var i=0; i<=grid.length; i++) {
        strokeLine(offsetx+i*scale,offsety,offsetx+i*scale,offsety+scale*grid[0].length,makeColor(1,1,1,1),5);
    }
    for (var i=0; i<=grid[0].length; i++) {
        strokeLine(offsetx,offsety+i*scale,offsetx+grid.length*scale,offsety+i*scale,makeColor(1,1,1,1),5);
    }
}


//--------------------------------------------------------------------------------------------------


function drawMaze() {
    var scale;
    if (height >= width) {
        scale = (canvas.height*0.8)/height;
    } else {
        scale = (canvas.width*0.6)/width;
    }
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
    var scale;
    if (height >= width) {
        scale = (canvas.height*0.8)/height;
    } else {
        scale = (canvas.width*0.6)/width;
    }
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
    clearRectangle(0, 0, screenWidth, screenHeight);
    drawGrid();
    //drawMaze();
    drawPaths();
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

function onTouchStart(x,y) {
    getGridLocation(x,y);
    MOUSE.down = true;
    if (MOUSE.x > -1 && MOUSE.y > -1) {
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
}

function onTouchEnd(x,y) {
    MOUSE.down = false;
    MOUSE.path = null;
    MOUSE.x = -1;
    MOUSE.y = -1;
    MOUSE.px = -1.0;
    MOUSE.py = -1.0;
}

function onMouseMove(x,y) {
    MOUSE.px = x;
    MOUSE.py = y;
}

function onTouchMove(x,y) {
    if (MOUSE.down == true && MOUSE.path != null) {
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
    var scale;
    if (height >= width) {
        scale = (canvas.height*0.8)/height;
    } else {
        scale = (canvas.width*0.6)/width;
    }
    var x = floor((px - offsetx) / scale);
    var y = floor((py - offsety) / scale);
    if (x < 0 || x >= width || y < 0 || y >= height) { 
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