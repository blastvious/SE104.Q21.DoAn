
function loadPage(page){
    const path = "./pages/" + page
    fetch(path)
    .then(res =>{
        if(!res.ok ) throw new Error("Path nor found" + path);
        
        return res.text()
    } )
    .then(data => {
        document.getElementById("main-content").innerHTML = data;
    })
    .catch(err => console.error(err)
     )

}