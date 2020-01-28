use juniper::{
    FieldResult,
    FieldError,
};

use {
    graphql_client::{ GraphQLQuery, Response },
};

use super::User;
use crate::models::{ Invite };
use crate::{ Context };
use crate::user_profile_query;

impl User {
    pub async fn authenticate(
        context: &Context,
        auth_token: String,
        identity_public_key: String
    ) -> FieldResult<User> {
        // TODO: switch url depending on environment
        let user_profile_server = "http://localhost:8080/graphql";

        use user_profile_query::{ UserProfileQuery, Variables, ResponseData };

        /*
        * Query the user profile server
        */
        let request_body = UserProfileQuery::build_query(Variables);

        let res: Response<ResponseData> = reqwest::Client::new()
            .post(user_profile_server)
            .json(&request_body)
            .send()
            .await?
            .json()
            .await?;

        if let Some(errors) = res.errors {
            return Err(FieldError::new(
                errors.iter().map(|e| e.message.clone()).collect::<Vec<String>>().join(" "),
                graphql_value!({ "internal_error": "Unable to fetch user profile data" }),
            ))
        }

        let user_profile = res.data
            .map(|data| data.current_user)
            .ok_or(
                FieldError::new(
                    "Invalid GraphQL Response: No error or data received",
                    graphql_value!({ "internal_error": "Unable to fetch user profile data" }),
                )
            )?;

        /*
        * Upsert and return the user
        */
        let user = sqlx::query_as!(
            User,
            "
                INSERT INTO users (name, user_profile_id, email, email_verified)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (user_profile_id) DO UPDATE SET
                    name = $1,
                    email = $3,
                    email_verified = $4
                RETURNING *
            ",
            // TODO: proper NULL handling
            user_profile.name.unwrap_or("".to_string()),
            user_profile.id,
            // TODO: proper NULL handling
            user_profile.email.unwrap_or("".to_string()),
            user_profile.email_verified
        )
            .fetch_one(&mut context.sqlx_db().await?)
            .await?;

        Ok(user)
    }
}