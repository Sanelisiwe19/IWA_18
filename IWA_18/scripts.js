import { state, createOrderData, updateDragging } from "./data.js";
import {
  html,
  createOrderHtml,
  updateDraggingHtml,
  moveToColumn,
} from "./view.js";

/**
 * A handler that fires when a user drags over any element inside a column. In
 * order to determine which column the user is dragging over the entire event
 * bubble path is checked with `event.path` (or `event.composedPath()` for
 * browsers that don't support `event.path`). The bubbling path is looped over
 * until an element with a `data-area` attribute is found. Once found both the
 * active dragging column is set in the `state` object in "data.js" and the HTML
 * is updated to reflect the new column.
 *
 * @param {Event} event
 */
const handleDragStart = (event) => {
  const orderId = event.target.dataset.id;
  updateDragging({ source: orderId });
  event.dataTransfer.setData("text/plain", orderId);
  event.target.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
};

const handleDragOver = (event) => {
  event.preventDefault();
  const path = event.path || event.composedPath();
  let column = null;

  for (const element of path) {
    const { area } = element.dataset;
    if (area) {
      column = area;
      break;
    }
  }

  if (!column) return;
  updateDragging({ over: column });
  updateDraggingHtml({ over: column });
};

const handleDrop = (event) => {
    event.preventDefault();
    const orderId = event.dataTransfer.getData("text/plain");
    const column = event.target.dataset.area;
  
    if (!column || !orderId) return;
  
    const order = state.orders[orderId];
    if (!order) return;
  
    order.column = column;
    updateDragging({ source: null });
  
    // Perform any additional tasks needed after dropping an item, e.g., updating the HTML.
  
    // Reset the columns and re-render the orders.
    handleEditSubmitReset();
  };
  
  // Add the event listener for the drop action on each column.
  for (const htmlArea of Object.values(html.area)) {
    htmlArea.addEventListener("drop", handleDrop);
  }
  

const handleDragEnd = (event) => {
  const orderId = event.target.dataset.id;
  updateDragging({ source: null });
  event.target.classList.remove("dragging");
};

const handleHelpToggle = (event) => {
  if (html.help.overlay.hasAttribute("open")) {
    html.help.overlay.removeAttribute("open");
    html.other.add.focus();
  } else {
    html.help.overlay.setAttribute("open", "");
  }
};

const handleAddToggle = (event) => {
  if (html.add.overlay.hasAttribute("open")) {
    html.add.overlay.removeAttribute("open");
    html.add.form.reset();
    html.other.add.focus();
  } else {
    html.add.overlay.setAttribute("open", "");
    html.add.form.reset();
    html.add.title.focus();
  }
};

const handleAddSubmit = (event) => {
  event.preventDefault();
  const title = html.add.title.value;
  const table = html.add.table.value;

  if (!title || !table) {
    return;
  }

  const newOrder = createOrderData({ title, table, column: "ordered" });
  state.orders[newOrder.id] = newOrder;

  const newOrderElement = createOrderHtml(newOrder);
  html.columns.ordered.appendChild(newOrderElement);

  html.add.overlay.removeAttribute("open");
  html.add.form.reset();
};

const handleEditToggle = (event) => {
  const targetOrderElement = event.target.closest(".order");

  if (!targetOrderElement) {
    return;
  }

  const orderId = targetOrderElement.dataset.id;
  const order = state.orders[orderId];

  if (!order) {
    return;
  }

  html.edit.title.value = order.title;
  html.edit.table.value = order.table;
  html.edit.id.setAttribute("data-edit-id", orderId);
  html.edit.column.value = order.column;

  html.edit.overlay.setAttribute("open", "");
};

const handleEditSubmit = (event) => {
  event.preventDefault();
  const orderId = html.edit.id.getAttribute("data-edit-id");
  const order = state.orders[orderId];

  if (!order) {
    return;
  }

  const updatedTitle = html.edit.title.value;
  const updatedTable = html.edit.table.value;
  const updatedColumn = html.edit.column.value;

  if (!updatedTitle || !updatedTable || !updatedColumn) {
    return;
  }

  order.title = updatedTitle;
  order.table = updatedTable;
  order.column = updatedColumn;
  order.created = new Date();

  handleEditSubmitReset();
};

const handleEditSubmitReset = () => {
  for (const column of Object.values(html.columns)) {
    column.innerHTML = "";
  }

  for (const order of Object.values(state.orders)) {
    const orderElement = createOrderHtml(order);
    html.columns[order.column].appendChild(orderElement);
  }

  html.edit.form.reset();
  html.edit.overlay.removeAttribute("open");
};

const handleDelete = (event) => {
  const orderId = html.edit.id.getAttribute("data-edit-id");
  delete state.orders[orderId];
  handleEditSubmitReset();
};

html.add.cancel.addEventListener("click", handleAddToggle);
html.other.add.addEventListener("click", handleAddToggle);
html.add.form.addEventListener("submit", handleAddSubmit);

html.other.help.addEventListener("click", handleHelpToggle);
html.help.cancel.addEventListener("click", handleHelpToggle);

html.other.grid.addEventListener("click", handleEditToggle);
html.edit.cancel.addEventListener("click", handleEditToggle);
html.edit.form.addEventListener("submit", handleEditSubmit);
html.edit.delete.addEventListener("click", handleDelete);

for (const htmlColumn of Object.values(html.columns)) {
  htmlColumn.addEventListener("dragstart", handleDragStart);
  htmlColumn.addEventListener("dragend", handleDragEnd);
}

for (const htmlArea of Object.values(html.area)) {
  htmlArea.addEventListener("dragover", handleDragOver);
}