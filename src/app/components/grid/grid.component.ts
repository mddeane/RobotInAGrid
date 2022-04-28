import { GridService } from './../../services/grid.service';
import { Square } from './../../models/square';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.css']
})
export class GridComponent implements OnInit {

  r: number = 0;  // rows
  c: number = 0;  // columns
  rows: number[] = [];  // array of row ids
  cols: number[] = [];  // array of column ids
  squares: number[] = [];
  moves: number = 0;
  paths: number = 0;
  atMostThisMany: number = 18;  // at most this many rows/columns
  atLeastThisMany: number = 8;  // at least this many rows/columns
  totalSquares: number = 0;
  blockedCutoff: number = 7;  // lower number makes more blocked squares
  squareArray: Square[] = []; // array of square objects that builds the grid
  goMoveArray: number[] = []; // all the valid positions, used to draw path 
  noGoArray: number[] = [];   // array of blocked or non valid squares
  //globalCount: number = 10000;    // all the moves considered by the robot, also prevents infinite loop
  blockedArray: number[] = [];  // array of blocked squares
  completed: boolean = false;   // flag for success
  noGo: boolean = false;        // flag for failure

  robot: string = "[o o]";  // the robot

  constructor() { }

  ngOnInit(): void {
    this.makeGrid();
  }

  public makeGrid(): void {
    this.clearGrid(); // reset variables

    // random values for r and c with a max and min
    this.r = Math.floor(Math.random() * (this.atMostThisMany - this.atLeastThisMany)) + this.atLeastThisMany + 1;
    this.c = Math.floor(Math.random() * (this.atMostThisMany - this.atLeastThisMany)) + this.atLeastThisMany + 1;

    // total of squares in the grid is rows times columns
    this.totalSquares = this.r * this.c;

    // building the grid
    // need to know where to stop the columns
    let counterColBlocker: number = 0;
    let counterColumn: number = 0;

    for (let i = 0; i < this.totalSquares; i++) {

      // reset for next row
      if (counterColumn == this.c) {
        counterColumn = 0;
        counterColBlocker = 0;
      }

      // fill square object properties
      if (counterColumn != this.c - 1) {
        this.squareArray[i] = {
          // id starts with 0, state is a number from 0-9, down is the next id  down, right is the next id right
          id: i, state: Math.floor(Math.random() * 10), down: i + this.c, right: i + 1
        }
      } else {
        // if it is the last column, the right move is negative
        this.squareArray[i] = {
          id: i, state: Math.floor(Math.random() * 10), down: i + this.c, right: -1
        }
      }
      counterColumn++;
    }

    // do some things to make the random blockeres less severe
    this.cleanGrid();

    // create array of squares that are blocked after cleanGrid may have changed the original build
    this.makeBlockedArray();

    // fill rows array
    for (let i = 0; i < this.r; i++) {
      this.rows[i] = i + 1;
    }

    // fill columns array
    for (let i = 0; i < this.c; i++) {
      this.cols[i] = i + 1;
    }

    // calcuate total moves possible
    // robot has only two choices each time
    this.moves = this.r + this.c - 2;

    // calculate total of possible paths
    this.paths = Math.pow(2, this.moves);

    console.log(this.squareArray);
  }

  // array of blocked squares
  public makeBlockedArray() {
    for (let i = 0; i < this.squareArray.length; i++) {
      if (this.squareArray[i].state > this.blockedCutoff) {
        this.noGoArray.push(this.squareArray[i].id);
      }
    }
    // add -1 to avoid problems at the end of the grid
    this.noGoArray.push(-1);
    console.log("No go: " + this.noGoArray);
  }

  // reset variables for new grid to work
  public clearGrid() {
    this.rows = [];
    this.cols = [];
    this.squareArray = [];
    this.moves = 0;
    this.goMoveArray = [];
    this.noGoArray = [];
    this.completed = false;
    this.noGo = false;

  }

  // make sure first space isn't blocked and robot isn't blocked at the start
  public cleanGrid() {
    this.squareArray[0].state = 0;
    this.squareArray[this.squareArray.length - 1].state = 0;
    if (this.squareArray[1].state > this.blockedCutoff) {
      this.squareArray[this.c].state = 0;
    }
    if (this.squareArray[this.squareArray.length - 2].state > this.blockedCutoff) {
      this.squareArray[this.squareArray.length - 1 - this.c].state = 0;
    }
  }

  // this moves the robot
  public go() {
    // first position is zero
    this.goMoveArray.push(0);
    let globalCount: number = 10000;    // all the moves considered by the robot, also prevents infinite loop

    console.log("No go: " + this.noGoArray);

    let goMoves: number = 0;
    let currentGoColumn: number = 0;
    let notInLastRow: boolean = true;
    let notInFirstRow: boolean = false;

    while (goMoves <= this.moves && globalCount > 0) {

      globalCount--;
      let downId: number = this.squareArray[currentGoColumn].down;
      let rightId: number = this.squareArray[currentGoColumn].right;

      if (currentGoColumn > this.squareArray.length - this.c - 1) {
        notInLastRow = false;
      } else {
        notInLastRow = true;
      }

      if (currentGoColumn < this.squareArray.length - this.c) {
        notInFirstRow = true;
      } else {
        notInFirstRow = false;
      }


      if (notInLastRow) {
        console.log("I am NOT in the last row.");
        if (!this.noGoArray.includes(downId)) {
          currentGoColumn = downId;
          this.goMoveArray.push(downId);
          goMoves++;
          console.log("I went down to ID " + downId);
        } else if (!this.noGoArray.includes(rightId)) {
          currentGoColumn = rightId;
          this.goMoveArray.push(rightId);
          goMoves++;
          console.log("I went right to ID: " + rightId);
        } else if (this.noGoArray.includes(downId) && this.noGoArray.includes(rightId)) {
          if (currentGoColumn != 0) {
            console.log("I can't go down or right at ID: " + currentGoColumn);
            this.noGoArray.push(currentGoColumn);
            console.log("Added ID " + currentGoColumn + " to the no go array.")
            this.goMoveArray.pop();
            currentGoColumn = this.goMoveArray[this.goMoveArray.length - 1];
            console.log("New currentGoColumn: " + currentGoColumn)
            goMoves--;
          } else {
            console.log("Sorry. I can't make it.");
            this.noGo = true;
            this.noGoArray.push(currentGoColumn);
            console.log("Added ID " + currentGoColumn + "to the no go array.")
            goMoves = this.moves + 1;
          }
        } else if (this.noGoArray.includes(downId) && rightId == -1) {
          console.log("I can't go down or right at ID: " + currentGoColumn);
          this.noGoArray.push(currentGoColumn);
          console.log("Added ID " + currentGoColumn + " to the no go array.")
          this.goMoveArray.pop();
          currentGoColumn = this.goMoveArray[this.goMoveArray.length - 1];
          console.log("New currentGoColumn: " + currentGoColumn)
          goMoves--;
        } else {
          console.log("I am STUCK at ID: " + currentGoColumn);
          this.noGoArray.push(currentGoColumn);
          console.log("Added ID " + currentGoColumn + " to the no go array.")
        }
      } else {
        console.log("I am in the last row.");
        if (currentGoColumn == this.squareArray.length - 1) {
          console.log("I made it to the end at ID:" + currentGoColumn);
          this.completed = true;
          goMoves++;
        } else if (!this.noGoArray.includes(rightId)) {
          currentGoColumn = rightId;
          this.goMoveArray.push(rightId);
          goMoves++;
          console.log("I went right to ID: " + rightId);
        } else if (this.noGoArray.includes(rightId)) {
          console.log("I can't go right at ID: " + currentGoColumn);
          this.noGoArray.push(currentGoColumn);
          console.log("Added ID " + currentGoColumn + " to the bo go array.")
          this.goMoveArray.pop();
          currentGoColumn = this.goMoveArray[this.goMoveArray.length - 1];
          console.log("New currentGoColumn: " + currentGoColumn)
          goMoves--;
        } else {
          console.log("I am STUCK at ID: " + currentGoColumn);
          this.noGoArray.push(currentGoColumn);
          console.log("Added ID " + currentGoColumn + "to the bo go array.")
          //goMoves = this.moves + 1;
        }
      }
    }

    // console.log("Moves: " + this.goMoveArray);
    // console.log("No go array: " + this.noGoArray);
    // console.log("Global count: " + globalCount);
    // console.log("Completed:" + this.completed);
    // console.log("No go:" + this.noGo);

    if (this.completed == false && globalCount == 0) {
      this.noGo = true;
    }
  }
}
