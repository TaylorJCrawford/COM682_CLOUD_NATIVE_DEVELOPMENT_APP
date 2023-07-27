import { v4 as uuidv4 } from 'uuid';

function upload_file(inpFile, field, path, newfile_name) {
  let temp_formData_values = new FormData();
  temp_formData_values.append(field, inpFile, newfile_name) //'taylors_newfile.mp4'

  let upload_uri = process.env.REACT_APP_FLASK_API + path
  fetch(upload_uri,
      { method: 'POST', body: temp_formData_values})
      .then(res => {
          return res.json()
      });
}

export function video_adder_updater(document, method_value, id, user_id) {
  let newfile_name = uuidv4();
  let uri = process.env.REACT_APP_FLASK_API
  let formData_values = new FormData();
  formData_values.append('user_id', user_id)
  formData_values.append('title', document.getElementById("title").value)
  formData_values.append('publisher', document.getElementById("publisher").value)
  formData_values.append('producer', document.getElementById("producer").value)
  formData_values.append('age_rating', document.getElementById("age_rating").value)
  formData_values.append('genra', document.getElementById("genra").value)

  if (method_value == 'POST')
  {
    // Adding New Movie
    const inpFile = document.getElementById("thumbnail_file");
    console.log("Beginning File Upload For Thumbnail.");
    upload_file(inpFile.files[0], 'thumbnail_file', 'upload/thumbnail', newfile_name + '.png');
    console.log("File Upload Complete For Thumbnail.");
    formData_values.append('thumbnail', newfile_name + '.png');

    const inpFile_video = document.getElementById("video_file");
    console.log(inpFile_video.files[0])
    console.log("Beginning File Upload For Video.");
    upload_file(inpFile_video.files[0], 'video_file', 'upload/video', newfile_name + '.mp4');
    console.log("File Upload Complete For Video.");
    formData_values.append('video_file', newfile_name + '.mp4');

    const inpFile_audio = document.getElementById("audio_file");
    formData_values.append('audio_file', inpFile_audio.files[0]);

    uri = uri + "clips"

  } else {
    // Method is PATCH - Therefore upading movie metadata.
    uri = uri + "clips/" + id
  }


  if (formData_values.get('audio_file') != null && method_value == 'POST')
  {
    console.log("Audio File Detected.")
    fetch (uri,
      { method: method_value, body: formData_values})
      .then(res => res.json())
      .then(data => {
        let uri2 = process.env.REACT_APP_FLASK_API + "video_to_text/" + data['id']
        return fetch(uri2, { method: method_value, body: formData_values});
      })
      .then(response => response.json())
      .then(data => console.log(data))
  }
  else
  {
    console.log("No Audio File Detected. Standard Upload.")
    fetch (uri,
      { method: method_value, body: formData_values})
      .then(res => res.json())
      .then(data => {
        console.log(data)
      })
  }

    return "New Movie Added / Updated."
}

export function add_video_transcript(document, id) {
  let uri = process.env.REACT_APP_FLASK_API
  uri = uri + "video_to_text/" + id

  let formData_values = new FormData();
  formData_values.append('audio_file', document.getElementById("audio_file").value)

  fetch(uri,
    {body: formData_values})
    .then(res => {
      return res.json()
    })
    .then((data) => {
      console.log(data)
    })

  return "New Transcript Has Been Added."

}