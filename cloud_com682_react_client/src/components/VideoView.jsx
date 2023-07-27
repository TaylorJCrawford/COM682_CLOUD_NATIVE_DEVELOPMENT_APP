import { React, useState, useEffect } from 'react';
import { useParams, Link} from 'react-router-dom'
import Comments from './Comments';
import { useAuth0 } from '@auth0/auth0-react'

const VideoView = () => {

  const {id} = useParams();
  const [comments, setComments] = useState("");
  const { user, isAuthenticated } = useAuth0();
  // console.log(user['sub'])

  console.log("*****************************************")
  console.log(process.env.REACT_APP_FLASK_API + 'clips/'+ id)
  useEffect(() => {
    fetch(process.env.REACT_APP_FLASK_API + 'clips/'+ id)
      .then(res => {
        return res.json()
      })
      .then((data) => {
        setComments(data[0]['feedback'])
        let part1 = process.env.REACT_APP_TOKEN_PART1 + "videos/";
        let part2 = process.env.REACT_APP_TOKEN_PART2;
        let complete_url = part1 + data[0]['video_file'] + part2
        console.log("******************COMPLETE_URL***********************")
        console.log(complete_url)
        document.getElementById("video_content").src = complete_url;
        // document.getElementById("tags").innerHTML = data[0]['genra'];
        if (data[0]['transcription'] != ""){
          document.getElementById("Content_DIV").innerHTML = data[0]['transcription']
        }
      })
  }, []);


  return (
    <div>
        <div className="row">
            <div className="col">
              <div className='video'>
                <video className='video_content' id='video_content' controls autoPlay muted>
                  <source src={""} type="video/mp4"/>
                </video>
              </div>
            </div>
            <div className="col">
              {
                (comments === "" || comments.length <= 0) ?

                  (comments === "") ?
                    <div className=''>
                      <br />
                        <h3 className='center_content' style={{color: 'White'}}> Loading... </h3>
                      <br /><br />
                      <h3 className='center_content' style={{color: 'White'}}> Almost there </h3>
                    </div>
                    :
                    <div className=''>
                      <br />
                        <h3 className='center_content' style={{color: 'White'}}> No Comments </h3>
                      <br />
                      <h3 className='center_content' style={{color: 'White'}}> To Display </h3>
                    </div>
                :
                  <Comments obj={comments} video_id={id} />
              }
            </div>
        </div>
        { isAuthenticated == true ?
            <Link to={"/comment/add/" + id}>
                <button className="btn btn-outline-success" type='' style={{color: "white", float: "right", marginTop: "20px", marginRight: "20px"} }>Add New Comment</button>
            </Link>
          :
            <></>
        }
        <h3 style={{marginTop: "20px", marginLeft: "20px", color: "white"}}>
          Transcription
        </h3>
        <p className='Content_DIV' id='Content_DIV' style={{color: "white", marginTop: "20px", marginLeft: "20px", width: "50%"} }>
          No Transcription Available!
        </p>
    </div>
  )
}

export default VideoView
