function createDoc(title, body){
  if (! body){
    body = "";
  }
  Docs.insert({title: title, body: body});
}

