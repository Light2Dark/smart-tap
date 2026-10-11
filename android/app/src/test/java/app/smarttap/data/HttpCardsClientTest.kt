package app.smarttap.data

import kotlinx.coroutines.test.runTest
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import java.io.IOException
import java.net.InetAddress
import java.net.ServerSocket
import java.net.Socket
import java.util.concurrent.LinkedBlockingQueue
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread

private const val UNREACHABLE = "Could not reach the card list. Is the web app running?"
private const val SIGNED_OUT = "Sign in again to load cards."

private data class Recorded(
    val requestLine: String,
    val headers: Map<String, String>,
    val body: String,
)

/** Answers every request with one canned response and records what it was sent. */
private class FakeServer(
    private val status: Int,
    private val body: String,
) : AutoCloseable {
    private val socket = ServerSocket(0, 1, InetAddress.getLoopbackAddress())
    val baseUrl = "http://127.0.0.1:${socket.localPort}"
    private val requests = LinkedBlockingQueue<Recorded>()

    init {
        thread(isDaemon = true) {
            while (!socket.isClosed) {
                val client =
                    try {
                        socket.accept()
                    } catch (_: IOException) {
                        break
                    }
                client.use(::answer)
            }
        }
    }

    fun next(): Recorded = checkNotNull(requests.poll(5, TimeUnit.SECONDS)) { "No request arrived." }

    private fun answer(client: Socket) {
        val input = client.getInputStream().bufferedReader()
        val requestLine = input.readLine() ?: return
        val headers =
            generateSequence { input.readLine()?.takeIf { it.isNotEmpty() } }
                .associate { it.substringBefore(":").lowercase() to it.substringAfter(":").trim() }
        val length = headers["content-length"]?.toInt() ?: 0
        val chars = CharArray(length)
        var read = 0
        while (read < length) {
            val count = input.read(chars, read, length - read)
            if (count < 0) break
            read += count
        }
        requests += Recorded(requestLine, headers, String(chars, 0, read))
        val bytes = body.toByteArray()
        client.getOutputStream().apply {
            write(
                (
                    "HTTP/1.1 $status Canned\r\nContent-Type: application/json\r\n" +
                        "Content-Length: ${bytes.size}\r\nConnection: close\r\n\r\n"
                ).toByteArray(),
            )
            write(bytes)
            flush()
        }
    }

    override fun close() = socket.close()
}

private fun closedPort(): String {
    val socket = ServerSocket(0, 1, InetAddress.getLoopbackAddress())
    val port = socket.localPort
    socket.close()
    return "http://127.0.0.1:$port"
}

class HttpCardsClientTest {
    private fun client(
        baseUrl: String,
        token: String? = "session-token",
    ) = HttpCardsClient(baseUrl) { token }

    @Test
    fun listSendsTheSessionAndParsesCards() =
        runTest {
            FakeServer(
                200,
                """{"cards":[{"id":6,"title":"GitHub","destinationUrl":"https://github.com","publicId":"p6"}]}""",
            ).use { server ->
                val result = client(server.baseUrl).list(trashed = true)

                val request = server.next()
                assertEquals("GET /api/cards?trashed=1 HTTP/1.1", request.requestLine)
                assertEquals("Bearer session-token", request.headers["authorization"])
                assertEquals("application/json", request.headers["accept"])
                assertEquals(
                    CardsResult.Ready(listOf(TapCard(6, "GitHub", "https://github.com", "p6"))),
                    result,
                )
            }
        }

    @Test
    fun anExpiredSessionAsksToSignInAgain() =
        runTest {
            FakeServer(401, """{"error":"Unauthorized"}""").use { server ->
                assertEquals(CardsResult.Failed(SIGNED_OUT), client(server.baseUrl).list(trashed = false))
            }
        }

    @Test
    fun noSessionNeverCallsTheServer() =
        runTest {
            assertEquals(CardsResult.Failed(SIGNED_OUT), client(closedPort(), token = null).list(trashed = false))
        }

    @Test
    fun serverErrorsShowTheirMessageOrAFallback() =
        runTest {
            FakeServer(500, """{"error":"Database is down."}""").use { server ->
                assertEquals(CardsResult.Failed("Database is down."), client(server.baseUrl).list(trashed = false))
            }
            FakeServer(502, "<html>Bad gateway</html>").use { server ->
                assertEquals(CardsResult.Failed("Could not load cards."), client(server.baseUrl).list(trashed = false))
            }
        }

    @Test
    fun createPostsTheTrimmedCard() =
        runTest {
            FakeServer(201, """{"card":{}}""").use { server ->
                assertNull(client(server.baseUrl).create("  Notes ", " https://notes.example.com "))

                val request = server.next()
                assertEquals("POST /api/cards HTTP/1.1", request.requestLine)
                assertEquals("application/json", request.headers["content-type"])
                val sent = JSONObject(request.body)
                assertEquals("Notes", sent.getString("title"))
                assertEquals("https://notes.example.com", sent.getString("destinationUrl"))
            }
        }

    @Test
    fun trashAndRestoreUseTheirOwnRoutes() =
        runTest {
            FakeServer(200, "{}").use { server ->
                val cards = client(server.baseUrl)
                assertNull(cards.setDeleted(4, trash = true))
                assertEquals("POST /api/cards/4/trash HTTP/1.1", server.next().requestLine)
                assertNull(cards.setDeleted(4, trash = false))
                assertEquals("POST /api/cards/4/restore HTTP/1.1", server.next().requestLine)
            }
        }

    @Test
    fun aWriteFailureUsesTheServerMessage() =
        runTest {
            FakeServer(404, """{"error":"Card not found."}""").use { server ->
                assertEquals("Card not found.", client(server.baseUrl).setDeleted(9, trash = true))
            }
        }

    @Test
    fun anUnreachableServerIsReportedForReadsAndWrites() =
        runTest {
            val cards = client(closedPort())
            assertEquals(CardsResult.Failed(UNREACHABLE), cards.list(trashed = false))
            assertEquals(UNREACHABLE, cards.create("Notes", "https://notes.example.com"))
        }
}
