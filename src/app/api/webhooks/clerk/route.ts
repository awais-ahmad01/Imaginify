import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest, NextResponse } from 'next/server'
import { createClerkClient } from '@clerk/backend'

import { createUser, updateUser, deleteUser } from '@/lib/database/actions/user.action'

// create a Clerk client instance
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_WEBHOOK_SIGNING_SECRET! })

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    const { id } = evt.data
    const eventType = evt.type

    console.log(`✅ Received webhook with ID ${id} and event type: ${eventType}`)
    console.log('Webhook payload:', evt.data)

    // CREATE
    if (eventType === "user.created") {
      const { id, email_addresses, image_url, first_name, last_name, username } = evt.data as any

      const user = {
        clerkId: id,
        email: email_addresses[0].email_address,
        username: username!,
        firstName: first_name,
        lastName: last_name,
        photo: image_url,
      }

      const newUser = await createUser(user)

      // set Clerk public metadata
      if (newUser) {
        console.log('Setting Clerk public metadata for user:', id, newUser)
        await clerkClient.users.updateUserMetadata(id, {
          publicMetadata: {
            userId: newUser._id,
          },
        })
      }

      return NextResponse.json({ message: "OK", user: newUser })
    }

    // UPDATE
    if (eventType === "user.updated") {
      const { id, image_url, first_name, last_name, username } = evt.data as any

      const user = {
        firstName: first_name,
        lastName: last_name,
        username: username!,
        photo: image_url,
      }

      const updatedUser = await updateUser(id, user)

      return NextResponse.json({ message: "OK", user: updatedUser })
    }

    // DELETE
    if (eventType === "user.deleted") {
      const { id } = evt.data as any

      const deletedUser = await deleteUser(id!)

      return NextResponse.json({ message: "OK", user: deletedUser })
    }

    // fallback for unhandled events
    console.log(`⚠️ Unhandled Clerk event type: ${eventType}`)
    return NextResponse.json({ message: "Unhandled event type" })
  } catch (err) {
    console.error('❌ Error verifying webhook:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}
