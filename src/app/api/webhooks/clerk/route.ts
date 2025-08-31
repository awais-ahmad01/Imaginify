// /* eslint-disable @typescript-eslint/no-explicit-any */

// import { verifyWebhook } from '@clerk/nextjs/webhooks'
// import { NextRequest, NextResponse } from 'next/server'
// import { createClerkClient } from '@clerk/backend'

// import { createUser, updateUser, deleteUser } from '@/lib/database/actions/user.action'

// // create a Clerk client instance
// const clerkClient = createClerkClient({ secretKey: process.env.CLERK_WEBHOOK_SIGNING_SECRET! })

// export async function POST(req: NextRequest) {
//   try {
//     const evt = await verifyWebhook(req)

//     const { id } = evt.data
//     const eventType = evt.type

//     console.log(`✅ Received webhook with ID ${id} and event type: ${eventType}`)
//     console.log('Webhook payload:', evt.data)

//     // CREATE
//     if (eventType === "user.created") {
//         console.log('Handling user.created event')
//       const { id, email_addresses, image_url, first_name, last_name, username } = evt.data as any

//       const user = {
//         clerkId: id,
//         email: email_addresses[0].email_address,
//         username: username,
//         firstName: first_name,
//         lastName: last_name,
//         photo: image_url,
//       }

//       console.log('Creating user with data:', user)

//       const newUser = await createUser(user)

//       console.log('New user created in database:', newUser)

//       // set Clerk public metadata
//       if (newUser) {
//         console.log('Setting Clerk public metadata for user:', id, newUser)
//         await clerkClient.users.updateUserMetadata(id, {
//           publicMetadata: {
//             userId: newUser._id,
//           },
//         })
//       }

//       return NextResponse.json({ message: "OK", user: newUser })
//     }

//     // UPDATE
//     // if (eventType === "user.updated") {
//     //   const { id, image_url, first_name, last_name, username } = evt.data as any

//     //   const user = {
//     //     firstName: first_name,
//     //     lastName: last_name,
//     //     username: username!,
//     //     photo: image_url,
//     //   }

//     //   const updatedUser = await updateUser(id, user)

//     //   return NextResponse.json({ message: "OK", user: updatedUser })
//     // }

//     // // DELETE
//     // if (eventType === "user.deleted") {
//     //   const { id } = evt.data as any

//     //   const deletedUser = await deleteUser(id!)

//     //   return NextResponse.json({ message: "OK", user: deletedUser })
//     // }

//     // fallback for unhandled events
//     console.log(`⚠️ Unhandled Clerk event type: ${eventType}`)
//     return NextResponse.json({ message: "Unhandled event type" })
//   } catch (err) {
//     console.error('❌ Error verifying webhook:', err)
//     return new Response('Error verifying webhook', { status: 400 })
//   }
// }






/* eslint-disable @typescript-eslint/no-explicit-any */
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest, NextResponse } from 'next/server'
import { createClerkClient } from '@clerk/backend'

import { createUser, updateUser, deleteUser } from '@/lib/database/actions/user.action'

// create a Clerk client instance
const clerkClient = createClerkClient({ 
  secretKey: process.env.CLERK_SECRET_KEY!, 
})

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    const { id } = evt.data
    const eventType = evt.type

    console.log(`✅ Webhook received`)
    console.log(`Event ID: ${id}`)
    console.log(`Event type: ${eventType}`)
    console.log(`Payload:`, JSON.stringify(evt.data, null, 2))

    // --- USER CREATED ---
    if (eventType === "user.created") {
      console.log("Handling user.created...")

      const { id, email_addresses, image_url, first_name, last_name, username } = evt.data as any

      const user = {
        clerkId: id,
        email: email_addresses?.[0]?.email_address,
        username: username ?? "",
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        photo: image_url ?? "",
      }

      console.log("Creating user in DB:", user)
      const newUser = await createUser(user)
      console.log("✅ User created in DB:", newUser)

      if (newUser) {
        try {
          console.log("🔄 Updating Clerk metadata for:", id)
          await clerkClient.users.updateUserMetadata(id, {
            publicMetadata: { userId: newUser._id.toString() },
          })
          console.log("✅ Clerk metadata updated successfully")
        } catch (metadataErr) {
          console.error("❌ Failed to update Clerk metadata:", metadataErr)
        }
      }

      return NextResponse.json({ message: "OK", user: newUser })
    }

    // --- USER UPDATED ---
    if (eventType === "user.updated") {
      console.log("Handling user.updated...")

      const { id, image_url, first_name, last_name, username } = evt.data as any

      const user = {
        firstName: first_name ?? "",
        lastName: last_name ?? "",
        username: username ?? "",
        photo: image_url ?? "",
      }

      const updatedUser = await updateUser(id, user)
      console.log("✅ User updated in DB:", updatedUser)

      return NextResponse.json({ message: "OK", user: updatedUser })
    }

    // --- USER DELETED ---
    if (eventType === "user.deleted") {
      console.log("Handling user.deleted...")

      const { id } = evt.data as any
      const deletedUser = await deleteUser(id!)
      console.log("✅ User deleted in DB:", deletedUser)

      return NextResponse.json({ message: "OK", user: deletedUser })
    }

    // --- FALLBACK ---
    console.log(`⚠️ Unhandled Clerk event type: ${eventType}`)
    return NextResponse.json({ message: "Unhandled event type" })
  } catch (err) {
    console.error("❌ Error verifying webhook:", err)
    return new Response("Error verifying webhook", { status: 400 })
  }
}
