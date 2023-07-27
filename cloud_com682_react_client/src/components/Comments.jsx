import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { delete_comment } from './Operations_Classes/Comment_Class';

const Comments = ({obj, video_id}) => {

  const { user, isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  let user_id;
  try
  {user_id = user['sub']}
  catch
  {user_id = 'null'}
  console.log(user_id)
  // let user_id = user['sub']

  function deleteComment(comment_id, temp_video_id) {
    let uri = process.env.REACT_APP_FLASK_API + "comments/" + comment_id
    delete_comment(comment_id)
    // let link = '/video/' + temp_video_id
    navigate('/message/Comment Deleted/' + temp_video_id);
  }

  console.log("8888888888888888888888");
  console.log(obj);

  return (
    <div className='card_holder'>
        {obj.map((data) => {
            return (
                <div className="card commnet">
                    <div className="card-header">
                        User ID: {data['user_id']}
                        { user_id == data['user_id'] ?
                          <a onClick={() => deleteComment(data['comment_id'], video_id)} style={{float: 'right', fontSize: 12, marginLeft: '10px'}} className="btn btn-danger">Delete</a>
                        :
                          <br/>
                        }
                    </div>
                    <div className="card-body">
                        <h5 className="card-title">Rating: {data['rating']}</h5>
                        <p className="card-text">{data['comment']}</p>
                    </div>
                </div>
            )
        })}
    </div>
  )
}

export default Comments