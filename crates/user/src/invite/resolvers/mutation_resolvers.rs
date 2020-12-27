use async_graphql::{
    FieldResult,
    ID,
    Context,
};
use anyhow::{
    Context as _,
    // Result
};

use crate::AuthContext;
use crate::invite::{
    Invite,
    InviteConfig,
    UnsavedInvite,
};

// Input Types
// ---------------------------------------------

#[derive(async_graphql::InputObject)]
pub struct CreateInviteInput {
    pub public_key: String,
    pub is_admin: Option<bool>,
}

#[derive(async_graphql::InputObject)]
pub struct UpdateInvite {
    #[graphql(name="inviteID")]
    pub invite_id: ID,
    pub is_admin: Option<bool>,
}

#[derive(async_graphql::InputObject)]
pub struct DeleteInvite {
    #[graphql(name="inviteID")]
    pub invite_id: ID,
}

// Resolvers
// ---------------------------------------------

struct Mutation();

#[async_graphql::Object]
impl Mutation {
    async fn create_invite<'ctx>(
        &self,
        ctx: &'ctx Context<'_>,
        input: CreateInviteInput,
    ) -> FieldResult<Invite> {
        let db: &crate::Db = ctx.data()?;
        let auth: &AuthContext = ctx.data()?;

        auth.authorize_admins_only()?;

        let invite = UnsavedInvite {
            config: InviteConfig {
                is_admin: input.is_admin.unwrap_or(false),
            },
            public_key: input.public_key,
            private_key: None,
            slug: None,
        };

        let invite = invite.insert(db).await?;

        Ok(invite)
    }

    async fn update_invite<'ctx>(&self, ctx: &'ctx Context<'_>, input: UpdateInvite) -> FieldResult<Invite> {
        let db: &crate::Db = ctx.data()?;
        let auth: &AuthContext = ctx.data()?;

        auth.authorize_admins_only()?;

        let invite_id = input.invite_id;
        let invite_id = invite_id.parse()
            .with_context(|| format!("Invalid invite id: {:?}", invite_id))?;

        let mut invite = Invite::get(db, invite_id).await?;

        invite.config.is_admin = input.is_admin.unwrap_or(invite.config.is_admin);

        invite.update(db).await?;

        Ok(invite)
    }

    async fn delete_invite<'ctx>(&self, ctx: &'ctx Context<'_>, input: DeleteInvite) -> FieldResult<Option<bool>> {
        let db: &crate::Db = ctx.data()?;
        let auth: &AuthContext = ctx.data()?;

        auth.authorize_admins_only()?;

        let DeleteInvite { invite_id } = input;
        let invite_id = invite_id.parse()
            .with_context(|| format!("Invalid invite id: {:?}", invite_id))?;

        Invite::remove(db, invite_id)
            .await
            .with_context(|| "Error deleting invite")?;

        Ok(None)
    }
}