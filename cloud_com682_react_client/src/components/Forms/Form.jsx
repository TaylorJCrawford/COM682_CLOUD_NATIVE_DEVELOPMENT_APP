import { React, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'
import { video_adder_updater, add_video_transcript } from '../Operations_Classes/Video_Class';
import { useAuth0 } from '@auth0/auth0-react'

function SendSubmit(id, navigate, user_id) {

    if (id == null)
    {
        //POST Request Add New Resource
        console.log("Starting to add new video.")
        console.log(video_adder_updater(document, 'POST', null, user_id))

        if (document.getElementById("audio_file").value.length != 0)
        {
            console.log("Starting to add video transcript...")
            console.log(add_video_transcript(document))
            console.log("Completed video transcript.")
        }

        navigate('/message/Video Added');
    } else {
        //PATCH Update Content
        console.log("Starting to update video metadata.")
        console.log(video_adder_updater(document, 'PATCH', id))
        navigate('/message/Video Updated');
    }
}

const Form = ({title}) => {

    let data = {
        title : 'title'
    }

    const {id} = useParams(null)
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth0();
    const [ dataValue, setDataValue ] = useState(data);
    // const { New_id, setID } = useState()
    console.log(id)

    // useEffect(() => {
    //     console.log("NEW ID VALUE IS !!!!!!!!!!!")
    //     console.log(New_id)
    // }, [New_id])

    console.log(process.env.REACT_APP_FLASK_API + "clips/" + id)
    console.log(title)

    useEffect(() => {
            fetch(process.env.REACT_APP_FLASK_API + "clips/" + id)
            .then(res => {
                return res.json()
            })
            .then((data) => {
                console.log(data[0]);
                console.log(title)
                if (title != 'Add')
                {
                    setDataValue(data)
                    document.getElementById("title").value = data[0]['title'];
                    document.getElementById("publisher").value = data[0]['publisher'];
                    document.getElementById("producer").value = data[0]['producer'];
                    document.getElementById("age_rating").value = data[0]['age_rating'];
                    document.getElementById("genra").value = data[0]['genra'];
                }
            })
        }, []);

        return(
            <div className='container_main collection_form'>
                        <div className="action">
                            <button type="button" onClick={() => SendSubmit(id, navigate, user['sub'])} class="btn btn-primary">Submit</button>
                            <button type="button" class="btn btn-secondary">Clear Form</button>
                        </div>
                        <h5 style={{color: 'White'}}>{title} Video</h5>
                        <form method="post" action="clips" enctype="multipart/form-data">
                            <div className="form-group">
                                <label for="title">Video Title</label>
                                <input type="text" className="form-control" id="title" name="title" placeholder="Title" />
                            </div>
                            <div className="form-group">
                                <label for="publisher">Publisher</label>
                                <input type="text" className="form-control" id="publisher" name="publisher" placeholder="Publisher"/>
                            </div>
                            <div className="form-group">
                                <label for="producer">Producer</label>
                                <input type="text" className="form-control" id="producer" name="producer" placeholder="Producer"/>
                            </div>
                            <div className="form-group">
                                <label for="age_rating">Age Rating</label>
                                <input type="number" className="form-control" id="age_rating" name="age_rating" placeholder="Age Rating"/>
                            </div>
                            <div className="form-group">
                                <label for="genra">Genra</label>
                                <input type="text" className="form-control" id="genra" name="genra" placeholder="genra (comma separated list)"/>
                            </div>
                <>
                        { title == 'Add' ?
                            <div>
                                <div className="form-group" style={{paddingTop: "20px"}}>
                                    <div id="drop-area">
                                        <p>Video File</p>
                                        <input type="file" accept="video/mp4,video/x-m4v,video/*" id="video_file" name="video_file" />
                                        <label className="button" for="video_file"></label>
                                    </div>
                                </div>
                                <div className="form-group" style={{paddingTop: "20px"}}>
                                    <div id="drop-area">
                                        <p>Thumbnail File</p>
                                        <input type="file" accept=".png, .jpeg, .jpg, .gif"  id="thumbnail_file" name="thumbnail_file" />
                                        <label className="button" for="thumbnail_file"></label>
                                    </div>
                                </div>
                                <div className="form-group" style={{paddingTop: "20px"}}>
                                    <div id="drop-area">
                                        <p>Add AutoFile <br/>
                                        This will be used to transcribe the audio to text
                                        and will appear at the bottom of the video.</p>
                                        <input type="file" accept=".wav"  id="audio_file" name="audio_file" />
                                        <label className="button" for="audio_file"></label>
                                    </div>
                                </div>
                            </div>
                        : <br/>
                        }
                        </>
                        </form>
                    </div>
        )
}

export default Form
