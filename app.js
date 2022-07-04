if (process.env.NODE_ENV != 'production') {
  require("dotenv").config();
}
console.log(process.env);
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
const app = express();

app.set('view engine', 'ejs');

//to write into the ejs or html file
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGOURL, { useNewUrlParser: true });
const itemsSchema = {
  name: String
};

const Item = mongoose.model('Item', itemsSchema);
const item1 = new Item({
  name: "welcome to todolist"
});
const item2 = new Item({
  name: "this is the second items being added"
});
const item3 = new Item({
  name: "this is to delete an item"
});

const defaultitems = [item1, item2, item3];
// Item.insertMany(defaultitems, (err)=>{
//   if(err){console.log(err);}
//   else{console.log("sucessfully saved to database");}
// })

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {

  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultitems, (err) => {
        if (err) { console.log(err); }
        else { console.log("sucessfully saved to database"); }
      });
      res.redirect("/"); //it will showcase items added meaning run the get again
    }
    else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  })
  var today = new Date();
  var options = {
    weekday: "long",
    day: "numeric",
    month: "long"
  }
  var day = today.toLocaleDateString("en-US", options);
});


app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //create a new list
        const list = new List({
          name: customListName,
          items: defaultitems
        });
        list.save();
        res.redirect("/" + customListName);
      }
      else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    } else {
      console.log(err);
    }
  })

});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list; //accessing via name we get back value
  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  }
  else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

});

app.post("/delete", function (req, res) {
  const checkedItemID = req.body.checkbox; //return the value
  const listName = req.body.listName;

  if (listName == "Today") {
    Item.findByIdAndRemove(checkedItemID, (err) => {
      if (!err) {
        console.log('successfull deleted item with item');
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemID } } }, (err, foundList) => {
      if (!err) {
        res.redirect("/" + listName);
      }
    })
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on port 3000.");
});
