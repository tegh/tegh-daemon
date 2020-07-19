// use chrono::prelude::*;
use async_graphql::*;
use serde::{
    Serialize,
    Deserialize,
};

// use crate::models::{ Invite };
use crate::{ Context };

#[SimpleObject]
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RTCSignal {
    #[field(name = "type")]
    pub r#type: String,
    pub sdp: String,
}

#[SimpleObject]
#[derive(Debug, Serialize, Deserialize)]
pub struct VideoSession {
    pub id: ID,
    pub answer: RTCSignal,
}

#[SimpleObject]
#[derive(Debug, Serialize, Deserialize)]
pub struct IceCandidate {
    pub candidate: String,
    #[field(name = "sdpMLineIndex")]
    #[serde(rename = "sdpMLineIndex")]
    pub sdp_mline_index: i32,
    #[serde(rename = "sdpMid")]
    pub sdp_mid: String,
}


#[InputObject]
#[derive(Debug, Serialize, Deserialize)]
pub struct RTCSignalInput {
    pub r#type: String,
    pub sdp: String,
}

#[SimpleObject]
#[derive(Debug, Serialize, Deserialize)]
pub struct Media {
    video: String,
}

#[SimpleObject]
#[derive(Debug, Serialize, Deserialize)]
pub struct VideoSource {
    id: ID,
}

const WEBRTC_STREAMER_API: &'static str = "http://localhost:8009/api";

pub async fn get_video_sources(
    _context: &Context,
) -> FieldResult<Vec<VideoSource>> {
    let media_list: Vec<Media> = reqwest::Client::new()
        .post(&format!("{}/getMediaList", WEBRTC_STREAMER_API))
        .send()
        .await?
        .json()
        .await?;

    let video_providers = media_list.into_iter()
        .map(|media| VideoSource {
            id: media.video.into()
        })
        .collect();

     Ok(video_providers)
}

pub async fn create_video_sdp(
    context: &Context,
    offer: RTCSignalInput,
// ) -> FieldResult<RTCSignal> {
) -> FieldResult<VideoSession> {
    let user = context.current_user
        .as_ref()
        .ok_or("Unauthorized to create video SDP")?;

    let id = format!("{}_{}", user.id.to_string(), rand::random::<u32>().to_string());

    // TODO: multiple video sources
    let source_url = context.machine_config
        .read()
        .await
        .get_videos()
        .next()
        .ok_or("No video source configured")?
        .source
        .to_owned();

    info!("creating video sdp for: {}", source_url);

    /*
    * Query the webrtc-streamer
    */
    let answer: RTCSignal = reqwest::Client::new()
        .post(&format!("{}/call", WEBRTC_STREAMER_API))
        .json(&offer)
        .query(&[
            ("peerid", id.to_string()),
            ("url", source_url),
            // ("url", "videocap://1".to_string()),
            // ("url", "mmal service 16.1".to_string()),
            ("options", "rtptransport=tcp&timeout=60".to_string()),
        ])
        .send()
        .await?
        .json()
        .await?;

    // // use std::sync::Arc;
    // // let id = Arc::new(id);
    // loop {
    //     // let id = Arc::clone(&id);
    //     let ice_candidates: Vec<IceCandidate> = reqwest::blocking::Client::new()
    //         .post(&format!("{}/getIceCandidate", WEBRTC_STREAMER_API))
    //         .json(&offer)
    //         .query(&[
    //             ("peerid", id.clone()),
    //         ])
    //         .send()?
    //         // .await?
    //         .json()?;
    //         // .await?;
    //
    //     info!("ICE: {:?}", ice_candidates);
    //
    //     use async_std::task;
    //     task::sleep(std::time::Duration::from_millis(500)).await;
    // };

    Ok(VideoSession {
        id: id.into(),
        answer,
    })
    // Ok(answer)
}

pub async fn get_ice_candidates(
    context: &Context,
    id: ID,
) -> FieldResult<Vec<IceCandidate>> {
    let user = context.current_user
        .as_ref()
        .ok_or("Unauthorized to create video SDP")?;

    if !id.starts_with(&format!("{}_", user.id.to_string()).to_string()) {
        Err("Invalid Video Session ID")?;
    }

    /*
    * Query the webrtc-streamer
    */
    // let id = Arc::clone(&id);
    let ice_candidates: Vec<IceCandidate> = reqwest::blocking::Client::new()
        .get(&format!("{}/getIceCandidate", WEBRTC_STREAMER_API))
        .query(&[
            ("peerid", id.to_string()),
        ])
        .send()?
        // .await?
        .json()?;
        // .await?;

    info!("ICE: {:?}", ice_candidates);

    Ok(ice_candidates)
}
