export function add_comment(document, clip_id, user_id) {

    let uri = process.env.REACT_APP_FLASK_API + 'comments/' + clip_id + '/' + user_id
    let formData_values = new FormData();

    const radioButtons = document.querySelectorAll('input[name="rating"]');
    var selectedRadioButton;
    for (const radioButton of radioButtons) {
        if (radioButton.checked) {
            selectedRadioButton = radioButton.value;
        }
    }

    formData_values.append('comment', document.getElementById("comment").value)
    formData_values.append('rating', selectedRadioButton)

    fetch(uri,
        { method: 'POST', body: formData_values})
        .then(res => {
            return res.json()
        })
        .then((data) => {
            console.log(data)
        })
      return "New Movie Added."
}

export function delete_comment(id) {
    let uri = process.env.REACT_APP_FLASK_API + "comments/" + id

    fetch(uri, {method: 'DELETE'})
          .then(res => {
            return res.json()
          });

    return "Comment was deleted."
}