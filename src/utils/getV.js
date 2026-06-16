let state = false
const fn = (version) => {
  if (state) return
  state = true
  setTimeout(() => {
    state = false
  }, 10000);

  fetch("/v.json", {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        'Cache-Control': 'no-cache'
      },
    })
    .then(response => response.json())
    .then(data => {
      console.log(`
        _.-^^---....,,--       
      _--                  --_  
     <                         >)
     |                          | 
      \\._                   _./  
         \`--. . , ; .--'         
               | |   |           
            .-=||  | |=-.   
            \`-=#$%&%$#=-'   
               | ;  :|     
      _____.,-#%&$@%#&#~,._____ 
      ${data.v}  ${version}
     `);
      if (version != data.v) {
        window.alert('有更新，请点击确定后使用最新版本。')
        location.reload()
      }
    });
}
export default fn