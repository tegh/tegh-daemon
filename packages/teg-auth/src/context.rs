use juniper::{FieldResult, FieldError};
use std::sync::Arc;

use crate::models::User;

pub struct Context {
    pub pool: Arc<sqlx::PgPool>,
    pub current_user: Option<User>,
}

// To make our context usable by Juniper, we have to implement a marker trait.
impl juniper::Context for Context {}

impl Context {
    pub async fn new(
        pool: Arc<sqlx::PgPool>,
        current_user_id: Option<i32>
    ) -> Result<Self, sqlx::Error> {
        let mut context = Self {
            pool,
            current_user: None,
        };

        if let Some(current_user_id) = current_user_id {
            context.current_user  = sqlx::query_as!(
                User,
                "SELECT * FROM users WHERE id = $1",
                current_user_id
            )
                .fetch_optional(&mut context.db().await?)
                .await?;
        }

        Ok(context)
    }

    pub async fn db(
        &self
    ) -> sqlx::Result<sqlx::pool::PoolConnection<sqlx::PgConnection>> {
        self.pool.acquire().await
    }

    pub async fn tx(
        &self
    ) -> sqlx::Result<sqlx_core::Transaction<sqlx::pool::PoolConnection<sqlx::PgConnection>>> {
        self.pool.begin().await
    }

    pub fn is_admin(&self) -> bool {
        self.current_user
            .as_ref()
            .map(|user| user.is_admin)
            .unwrap_or(false)
    }

    pub fn authorize_admins_only(&self) -> FieldResult<()> {
        if self.is_admin() {
            Ok(())
        } else  {
            Err(FieldError::new(
                "Unauthorized",
                graphql_value!({ "internal_error": "Unauthorized" }),
            ))
        }
    }
}