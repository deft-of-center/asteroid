function ChangeManager(priorityFunction){
  this.priorityQueue = [];
  this.priorityFunction = priorityFunction;
  this.receivedIds = {};
  this.history = [];
  this.invalid = false;

  this.processingContext = null;
}

ChangeManager.prototype = {

  invalidate: function() {
      this.invalid = true;
      if (this.processingContext) {
          this.processingContext.invalidate();
      }
  },

  push: function(element) {
    // Add the new element to the end of the array.
    if (! (element.uuid in this.receivedIds) ) {
      this.receivedIds[element.uuid] = true;
      this.priorityQueue.push(element);
      // Allow it to bubble up.
      this.bubbleUp(this.priorityQueue.length - 1);
      this.invalidate();
    }
  },

  pop: function() {
    // Store the first element so we can return it later.
    var result = this.priorityQueue[0];
    // Get the element at the end of the array.
    var end = this.priorityQueue.pop();
    // If there are any elements left, put the end element at the
    // start, and let it sink down.
    if (this.priorityQueue.length > 0) {
      this.priorityQueue[0] = end;
      this.sinkDown(0);
    }
    this.history.push(result);
    return result;
  },

  size: function() {
    return this.priorityQueue.length;
  },

  bubbleUp: function(n) {
    // Fetch the element that has to be moved.
    var element = this.priorityQueue[n];
    // When at 0, an element can not go up any further.
    while (n > 0) {
      // Compute the parent element's index, and fetch it.
      var parentN = Math.floor((n + 1) / 2) - 1,
          parent = this.priorityQueue[parentN];
      // Swap the elements if the parent is greater.
      if (this.priorityFunction(element) < this.priorityFunction(parent)) {
        this.priorityQueue[parentN] = element;
        this.priorityQueue[n] = parent;
        // Update 'n' to continue at the new position.
        n = parentN;
      }
      // Found a parent that is less, no need to move it further.
      else {
        break;
      }
    }
  },

  sinkDown: function(n) {
    // Look up the target element and its score.
    var length = this.priorityQueue.length,
        element = this.priorityQueue[n],
        elemScore = this.priorityFunction(element);

    while(true) {
      // Compute the indices of the child elements.
      var child2N = (n + 1) * 2, child1N = child2N - 1;
      // This is used to store the new position of the element,
      // if any.
      var swap = null;
      // If the first child exists (is inside the array)...
      if (child1N < length) {
        // Look it up and compute its score.
        var child1 = this.priorityQueue[child1N],
            child1Score = this.priorityFunction(child1);
        // If the score is less than our element's, we need to swap.
        if (child1Score < elemScore)
          swap = child1N;
      }
      // Do the same checks for the other child.
      if (child2N < length) {
        var child2 = this.priorityQueue[child2N],
            child2Score = this.priorityFunction(child2);
        if (child2Score < (swap == null ? elemScore : child1Score))
          swap = child2N;
      }

      // If the element needs to be moved, swap it, and continue.
      if (swap != null) {
        this.priorityQueue[n] = this.priorityQueue[swap];
        this.priorityQueue[swap] = element;
        n = swap;
      }
      // Otherwise, we are done.
      else {
        break;
      }
    }
  },

};
