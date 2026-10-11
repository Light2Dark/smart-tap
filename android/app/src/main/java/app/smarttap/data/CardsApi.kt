package app.smarttap.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

private const val UNREACHABLE = 0
private const val TIMEOUT_MS = 10_000
private val SUCCESS = HttpURLConnection.HTTP_OK until HttpURLConnection.HTTP_MULT_CHOICE

interface CardsClient {
    suspend fun list(trashed: Boolean): CardsResult

    suspend fun create(
        title: String,
        destinationUrl: String,
    ): String?

    suspend fun updateDestination(
        id: Long,
        destinationUrl: String,
    ): String?

    suspend fun setDeleted(
        id: Long,
        trash: Boolean,
    ): String?
}

sealed interface CardsResult {
    data class Ready(
        val cards: List<TapCard>,
    ) : CardsResult

    data class Failed(
        val message: String,
    ) : CardsResult
}

class HttpCardsClient(
    private val baseUrl: String,
    private val token: suspend () -> String?,
) : CardsClient {
    override suspend fun list(trashed: Boolean): CardsResult {
        val path = if (trashed) "/api/cards?trashed=1" else "/api/cards"
        val (status, body) = request("GET", path, null)
        val problem = statusProblem(status, body, "Could not load cards.")
        if (problem != null) {
            return CardsResult.Failed(problem)
        }
        return CardsResult.Ready(parseCardList(body))
    }

    override suspend fun create(
        title: String,
        destinationUrl: String,
    ): String? {
        val body =
            JSONObject()
                .put("title", title.trim())
                .put("destinationUrl", destinationUrl.trim())
        return mutation("POST", "/api/cards", body, "Could not add that card.")
    }

    override suspend fun updateDestination(
        id: Long,
        destinationUrl: String,
    ): String? {
        val body = JSONObject().put("destinationUrl", destinationUrl.trim())
        return mutation("PATCH", "/api/cards/$id", body, "Could not update that destination.")
    }

    override suspend fun setDeleted(
        id: Long,
        trash: Boolean,
    ): String? {
        val path = if (trash) "/api/cards/$id/trash" else "/api/cards/$id/restore"
        val failure = if (trash) "Could not delete that card." else "Could not restore that card."
        return mutation("POST", path, null, failure)
    }

    private suspend fun mutation(
        method: String,
        path: String,
        body: JSONObject?,
        failure: String,
    ): String? {
        val (status, response) = request(method, path, body)
        return statusProblem(status, response, failure)
    }

    private fun statusProblem(
        status: Int,
        body: String,
        failure: String,
    ): String? =
        when (status) {
            UNREACHABLE -> "Could not reach the card list. Is the web app running?"
            HttpURLConnection.HTTP_UNAUTHORIZED -> "Sign in again to load cards."
            in SUCCESS -> null
            else -> errorMessage(body, failure)
        }

    private suspend fun request(
        method: String,
        path: String,
        body: JSONObject?,
    ): Pair<Int, String> {
        val session = token() ?: return HttpURLConnection.HTTP_UNAUTHORIZED to """{"error":"Sign in required."}"""
        return withContext(Dispatchers.IO) {
            try {
                exchange(method, path, body, session)
            } catch (_: IOException) {
                UNREACHABLE to ""
            }
        }
    }

    private fun exchange(
        method: String,
        path: String,
        body: JSONObject?,
        session: String,
    ): Pair<Int, String> {
        val connection = URL("$baseUrl$path").openConnection() as HttpURLConnection
        try {
            connection.requestMethod = method
            connection.instanceFollowRedirects = false
            connection.connectTimeout = TIMEOUT_MS
            connection.readTimeout = TIMEOUT_MS
            connection.setRequestProperty("Authorization", "Bearer $session")
            connection.setRequestProperty("Accept", "application/json")
            if (body != null) {
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json")
                connection.outputStream.use { it.write(body.toString().toByteArray()) }
            }
            val status = connection.responseCode
            val stream = if (status in SUCCESS) connection.inputStream else connection.errorStream
            return status to stream?.bufferedReader()?.use { it.readText() }.orEmpty()
        } finally {
            connection.disconnect()
        }
    }
}

fun parseCardList(body: String): List<TapCard> {
    val cards = JSONObject(body).optJSONArray("cards") ?: return emptyList()
    return List(cards.length()) { index ->
        val card = cards.getJSONObject(index)
        TapCard(
            id = card.getLong("id"),
            title = card.getString("title"),
            destinationUrl = card.getString("destinationUrl"),
            publicId = card.getString("publicId"),
            imageUrl = card.optString("imageUrl").takeIf { it.isNotBlank() },
            backImageUrl = card.optString("backImageUrl").takeIf { it.isNotBlank() },
        )
    }
}

private fun errorMessage(
    body: String,
    fallback: String,
): String =
    runCatching { JSONObject(body).optString("error") }.getOrNull().takeUnless { it.isNullOrBlank() }
        ?: fallback
